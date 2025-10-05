import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, Modal, Chip, Menu, MenuItem, lighten, useTheme, useMediaQuery } from '@mui/material';
import axios from 'axios';
import NodeListPage from './NodeListPage';
import IconButton from '@mui/material/IconButton';
import CreateIcon from '@mui/icons-material/Create';
import html2canvas from 'html2canvas';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import PanToolIcon from '@mui/icons-material/PanTool';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

const Canvas = () => {
    const { fileId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId') || localStorage.getItem('tempUserId');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);
    const [toolMode, setToolMode] = useState('select');

    const [draggingNode, setDraggingNode] = useState(null);
    const [draggingNote, setDraggingNote] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const lastPosition = useRef({ x: 0, y: 0 });
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState(null);
    const [isNodeListModalOpen, setIsNodeListModalOpen] = useState(false);

    const [notes, setNotes] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    const [anchorEl, setAnchorEl] = useState(null);
    const [userFiles, setUserFiles] = useState([]);
    const menuOpen = Boolean(anchorEl);

    const [isHovered, setIsHovered] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCanvasName, setNewCanvasName] = useState('');

    const [isEditingFileName, setIsEditingFileName] = useState(false);
    const [currentFileName, setCurrentFileName] = useState('');

    const newNodeFromNews = location.state?.newNodeFromNews;
    const nodeCreatedFromNews = location.state?.nodeCreated;

    // タッチイベント対応
    const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
    const [isTouching, setIsTouching] = useState(false);

    const [touchStartTime, setTouchStartTime] = useState(0);
    const [lastTap, setLastTap] = useState(0);

    const [longPressTimer, setLongPressTimer] = useState(null);

    const handleDeleteFile = async (fileIdToDelete, fileName) => {
        if (window.confirm(`ファイル「${fileName}」を削除しますか？この操作は取り消せません。`)) {
            try {
                await axios.delete(`http://localhost:8080/api/files/${fileIdToDelete}`);
                
                setUserFiles(userFiles.filter(file => file.id !== fileIdToDelete));
                
                if (fileIdToDelete.toString() === fileId) {
                    if (userFiles.length > 1) {
                        const remainingFiles = userFiles.filter(file => file.id !== fileIdToDelete);
                        navigate(`/canvas/${remainingFiles[0].id}`);
                    } else {
                        setIsCreateModalOpen(true);
                        handleMenuClose();
                    }
                }
                
                alert('ファイルが削除されました。');
            } catch (error) {
                console.error('ファイル削除エラー:', error);
                alert('ファイルの削除に失敗しました。');
            }
        }
    };

    const fetchFileName = async (id) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/files/${id}`);
            setCurrentFileName(response.data.name);
        } catch (error) {
            console.error('ファイル名の取得エラー:', error);
        }
    };

    useEffect(() => {
        localStorage.removeItem('tempUserId');
    }, []);
    
    useEffect(() => {
        const fetchData = async () => {
            if (!userId) {
                setError("ユーザーIDがありません。ログインし直してください。");
                setLoading(false);
                return;
            }
            if (!fileId) {
                setLoading(false);
                setCurrentFileName('新しいキャンバス');
                return;
            }

            try {
                await fetchFileName(fileId);
                const ideasResponse = await axios.get(`http://localhost:8080/api/ideas/file/${fileId}`);
                const notesResponse = await axios.get(`http://localhost:8080/api/notes/file/${fileId}`);
                
                setIdeas(ideasResponse.data);
                setNotes(notesResponse.data);

                const newNode = location.state?.newNode;

                if (newNode) {
                    setEditingIdea({ ...newNode, tags: newNode.tags || [] });
                    setIsModalOpen(true);
                    
                    navigate(`/canvas/${fileId}`, { replace: true, state: { userId: userId, fileId: fileId } });
                }

            } catch (err) {
                setError("データの取得に失敗しました。");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fileId, userId, location.state, navigate]);

    useEffect(() => {
        if (newNodeFromNews) {
            const createAndEditNode = async () => {
                try {
                    const response = await axios.post('http://localhost:8080/api/ideas', {
                        ...newNodeFromNews,
                        posX: Math.random() * 200,
                        posY: Math.random() * 200,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    
                    const newIdea = response.data;
                    setIdeas([...ideas, newIdea]);
                    
                    setEditingIdea({ ...newIdea, tags: newIdea.tags || [] });
                    setIsModalOpen(true);
                } catch (err) {
                    console.error('ノード作成エラー:', err);
                }
            };
            createAndEditNode();

            navigate(`/canvas/${fileId}`, { replace: true, state: { userId: userId, fileId: fileId } });
        }
    }, [newNodeFromNews]);

    useEffect(() => {
        if (nodeCreatedFromNews) {
            // 追加のロジック
        }
    }, [nodeCreatedFromNews]);

    useEffect(() => {
        const fetchAllTags = () => {
            const tags = ideas.reduce((acc, idea) => {
                if (idea.tags) {
                    return acc.concat(idea.tags);
                }
                return acc;
            }, []);
            setAllTags([...new Set(tags)]);
        };
        fetchAllTags();
    }, [ideas]);

    useEffect(() => {
        const handleKeyDown = async (e) => {
            if (isModalOpen || isNodeListModalOpen || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if ((e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();

                if (selectedNodeId) {
                    const confirmDelete = window.confirm('本当にこのノードを削除しますか？');
                    if (confirmDelete) {
                        try {
                            await axios.delete(`http://localhost:8080/api/ideas/${selectedNodeId}`);
                            setIdeas(ideas.filter(idea => idea.id !== selectedNodeId));
                            setSelectedNodeId(null);
                            alert('ノードが削除されました。');
                        } catch (err) {
                            console.error('ノード削除エラー:', err);
                            alert('ノードの削除に失敗しました。');
                        }
                    }
                }

                if (selectedNoteId) {
                    const confirmDelete = window.confirm('本当にこの付箋を削除しますか？');
                    if (confirmDelete) {
                        try {
                            await axios.delete(`http://localhost:8080/api/notes/${selectedNoteId}`);
                            setNotes(notes.filter(note => note.id !== selectedNoteId));
                            setSelectedNoteId(null);
                            alert('付箋が削除されました。');
                        } catch (err) {
                            console.error('付箋削除エラー:', err);
                            alert('付箋の削除に失敗しました。');
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNodeId, selectedNoteId, ideas, notes, isModalOpen, isNodeListModalOpen]);

    useEffect(() => {
        if (userId) {
            fetchFiles();
        }
    }, [userId]);

    // タッチイベントハンドラー
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setTouchStartPos({ x: touch.clientX, y: touch.clientY });
            setIsTouching(true);
            
            if (toolMode === 'move') {
                setIsDraggingCanvas(true);
                lastPosition.current = { x: touch.clientX, y: touch.clientY };
            }
        }
    };

    const handleTouchMove = (e) => {
        if (!isTouching) return;

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            
            if (toolMode === 'move' && isDraggingCanvas) {
                e.preventDefault();
                const deltaX = touch.clientX - lastPosition.current.x;
                const deltaY = touch.clientY - lastPosition.current.y;
                setCanvasOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
                lastPosition.current = { x: touch.clientX, y: touch.clientY };
            }
        }
    };

    const handleTouchEnd = (e) => {
        setIsTouching(false);
        setIsDraggingCanvas(false);
        
        // タップジェスチャーの判定
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const distance = Math.sqrt(
                Math.pow(touch.clientX - touchStartPos.x, 2) + 
                Math.pow(touch.clientY - touchStartPos.y, 2)
            );
            
            // 短い移動距離ならタップとして処理
            if (distance < 10) {
                handleCanvasClick({
                    currentTarget: e.currentTarget,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: { closest: () => null }
                });
            }
        }
    };

    const handleCanvasMouseDown = (e) => {
        setSelectedNodeId(null);
        setSelectedNoteId(null);

        if (toolMode === 'move') {
            setIsDraggingCanvas(true);
            lastPosition.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseDown = (e, item) => {
        if (isCreatingNode || toolMode === 'move') return;

        e.stopPropagation();

        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();

        if (item.nodeType) {
            setDraggingNode(item.id);
        } else {
            setDraggingNote(item.id);
        }

        setOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseMove = (e) => {
        if (toolMode === 'move' && isDraggingCanvas) {
            const deltaX = e.clientX - lastPosition.current.x;
            const deltaY = e.clientY - lastPosition.current.y;
            setCanvasOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
            lastPosition.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (!draggingNode && !draggingNote) return;

        const canvasRect = e.currentTarget.getBoundingClientRect();
        const newPosX = e.clientX - canvasRect.left - offset.x - canvasOffset.x;
        const newPosY = e.clientY - canvasRect.top - offset.y - canvasOffset.y;

        if (draggingNode) {
            setIdeas(ideas.map(idea =>
                idea.id === draggingNode ? { ...idea, posX: newPosX, posY: newPosY } : idea
            ));
        } else if (draggingNote) {
            setNotes(notes.map(note =>
                note.id === draggingNote ? { ...note, posX: newPosX, posY: newPosY } : note
            ));
        }
    };

    const handleMouseUp = async (e) => {
        if (isDraggingCanvas) {
            setIsDraggingCanvas(false);
            return;
        }

        if (draggingNode) {
            const updatedIdea = ideas.find(idea => idea.id === draggingNode);
            if (updatedIdea) {
                try {
                    await axios.put(`http://localhost:8080/api/ideas/${updatedIdea.id}`, updatedIdea);
                    console.log('ノードの位置が更新されました。');
                } catch (err) {
                    console.error('ノードの位置更新エラー:', err);
                }
            }
        }

        if (draggingNote) {
            const updatedNote = notes.find(note => note.id === draggingNote);
            if (updatedNote) {
                try {
                    await axios.put(`http://localhost:8080/api/notes/${updatedNote.id}`, updatedNote);
                    console.log('付箋の位置が更新されました。');
                } catch (err) {
                    console.error('付箋の位置更新エラー:', err);
                }
            }
        }

        setDraggingNode(null);
        setDraggingNote(null);
    };

    const handleDeleteNode = async (item) => {
        try {
            if (item.nodeType) {
                await axios.delete(`http://localhost:8080/api/ideas/${item.id}`);
                setIdeas(ideas.filter(idea => idea.id !== item.id));
            } else {
                await axios.delete(`http://localhost:8080/api/notes/${item.id}`);
                setNotes(notes.filter(note => note.id !== item.id));
            }
            alert('削除されました。');
        } catch (err) {
            console.error('削除エラー:', err);
            alert('削除に失敗しました。');
        }
    };

    // ノード用タッチイベントハンドラー
    const handleNodeTouchStart = (e, item) => {
        if (toolMode === 'move' || isCreatingNode) return;
        
        e.stopPropagation();
        const touch = e.touches[0];
        setTouchStartPos({ x: touch.clientX, y: touch.clientY });
        setTouchStartTime(Date.now());
        setIsTouching(true);
    
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
    
        if (item.nodeType) {
            setDraggingNode(item.id);
        } else {
            setDraggingNote(item.id);
        }
    
        setOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        });
    
        // 長押し検出（800ms）
        const timer = setTimeout(() => {
            if (window.confirm(`「${item.title || 'この付箋'}」を削除しますか？`)) {
                handleDeleteNode(item);
            }
            setDraggingNode(null);
            setDraggingNote(null);
            setIsTouching(false);
        }, 800);
        
        setLongPressTimer(timer);
    };

    const handleNodeTouchMove = (e, item) => {
        // 移動が始まったら長押しタイマーをキャンセル
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    
        if (!isTouching || (!draggingNode && !draggingNote)) return;
    
        e.preventDefault();
        const touch = e.touches[0];
        const canvasRect = document.getElementById('export-target').getBoundingClientRect();
        const newPosX = touch.clientX - canvasRect.left - offset.x - canvasOffset.x;
        const newPosY = touch.clientY - canvasRect.top - offset.y - canvasOffset.y;
    
        if (draggingNode) {
            setIdeas(ideas.map(idea =>
                idea.id === draggingNode ? { ...idea, posX: newPosX, posY: newPosY } : idea
            ));
        } else if (draggingNote) {
            setNotes(notes.map(note =>
                note.id === draggingNote ? { ...note, posX: newPosX, posY: newPosY } : note
            ));
        }
    };
    

    const handleNodeTouchEnd = async (e, item) => {
        // 長押しタイマーをクリア
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    
        const touchDuration = Date.now() - touchStartTime;
        const touch = e.changedTouches[0];
        const distance = Math.sqrt(
            Math.pow(touch.clientX - touchStartPos.x, 2) + 
            Math.pow(touch.clientY - touchStartPos.y, 2)
        );
    
        if (draggingNode) {
            const updatedIdea = ideas.find(idea => idea.id === draggingNode);
            if (updatedIdea) {
                try {
                    await axios.put(`http://localhost:8080/api/ideas/${updatedIdea.id}`, updatedIdea);
                } catch (err) {
                    console.error('ノードの位置更新エラー:', err);
                }
            }
        }
    
        if (draggingNote) {
            const updatedNote = notes.find(note => note.id === draggingNote);
            if (updatedNote) {
                try {
                    await axios.put(`http://localhost:8080/api/notes/${updatedNote.id}`, updatedNote);
                } catch (err) {
                    console.error('付箋の位置更新エラー:', err);
                }
            }
        }
    
        setDraggingNode(null);
        setDraggingNote(null);
        setIsTouching(false);
    
        // ダブルタップ判定（編集用）
        const now = Date.now();
        if (distance < 10 && touchDuration < 300) {
            if (now - lastTap < 300) {
                // ダブルタップ → 編集モーダルを開く
                if (item.nodeType) {
                    setEditingIdea({ ...item, tags: item.tags || [] });
                    setIsModalOpen(true);
                }
            } else {
                // シングルタップ → 選択
                setSelectedNoteId(null);
                setSelectedNodeId(prevId => prevId === item.id ? null : item.id);
            }
            setLastTap(now);
        }
    };

    const handleCanvasClick = (e) => {
        if (toolMode === 'select' || e.target.closest('.MuiButtonBase-root')) {
            setSelectedNodeId(null);
            setSelectedNoteId(null);
            return;
        }

        const canvasRect = e.currentTarget.getBoundingClientRect();
        const posX = e.clientX - canvasRect.left - canvasOffset.x;
        const posY = e.clientY - canvasRect.top - canvasOffset.y;

        if (toolMode === 'createNode') {
            const newIdea = {
                title: '新しいアイデア',
                description: 'ここを編集できます',
                userId: userId,
                fileId: fileId,
                nodeType: 'IDEA',
                posX: posX,
                posY: posY,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            axios.post('http://localhost:8080/api/ideas', newIdea)
                .then(response => {
                    setIdeas([...ideas, response.data]);
                    setToolMode('select');
                })
                .catch(err => {
                    console.error('ノード作成エラー:', err);
                    alert('ノードの作成に失敗しました。');
                });
        }

        if (toolMode === 'createNote') {
            const newNote = {
                text: '付箋',
                posX: posX,
                posY: posY,
                userId: userId,
                fileId: fileId
            };
            axios.post('http://localhost:8080/api/notes', newNote)
                .then(response => {
                    setNotes([...notes, response.data]);
                    setToolMode('select');
                })
                .catch(err => {
                    console.error('付箋作成エラー:', err);
                });
        }
    };

    const handleNodeDoubleClick = (e, idea) => {
        e.stopPropagation();
        setEditingIdea({ ...idea, tags: idea.tags || [] });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingIdea(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingIdea({ ...editingIdea, [name]: value });
    };

    const handleUpdateIdea = async () => {
        if (!editingIdea.title.trim()) {
            alert('タイトルは必須です。');
            return;
        }

        try {
            await axios.put(`http://localhost:8080/api/ideas/${editingIdea.id}`, {
                ...editingIdea,
                updatedAt: new Date().toISOString()
            });

            setIdeas(ideas.map(idea =>
                idea.id === editingIdea.id ? editingIdea : idea
            ));

            handleCloseModal();
            alert('ノードが更新されました！');

        } catch (err) {
            console.error('ノード更新エラー:', err);
            alert('ノードの更新に失敗しました。');
        }
    };

    const handleNoteTextChange = async (e, noteId) => {
        const newNotes = notes.map(note =>
            note.id === noteId ? { ...note, text: e.target.value } : note
        );
        setNotes(newNotes);

        try {
            const updatedNote = newNotes.find(note => note.id === noteId);
            await axios.put(`http://localhost:8080/api/notes/${updatedNote.id}`, updatedNote);
            console.log('付箋のテキストが更新されました。');
        } catch (err) {
            console.error('付箋テキスト更新エラー:', err);
        }
    };

    const handleTagInputKeyDown = (e) => {
        if (e.keyCode === 229) {
            return;
        }

        if (e.key === 'Enter' && e.target.value) {
            e.preventDefault();
            const newTag = e.target.value.trim();
            const currentTags = editingIdea.tags || [];
            if (newTag && !currentTags.includes(newTag)) {
                setEditingIdea({
                    ...editingIdea,
                    tags: [...currentTags, newTag]
                });
            }
            e.target.value = '';
        }
    };

    const handleDeleteTag = (tagToDelete) => {
        setEditingIdea({
            ...editingIdea,
            tags: editingIdea.tags.filter(tag => tag !== tagToDelete)
        });
    };

    const handleGoToNews = () => {
        navigate(`/news/${fileId}`, { state: { userId: userId, fileId: fileId } });
    };

    const filteredIdeas = selectedTags.length > 0
        ? ideas.filter(idea => idea.tags && selectedTags.some(tag => idea.tags.includes(tag)))
        : ideas;

    const handleMenuClick = async (event) => {
        setAnchorEl(event.currentTarget);
        if (userFiles.length === 0) {
            try {
                const response = await axios.get(`http://localhost:8080/api/files/user/${userId}`);
                setUserFiles(response.data);
            } catch (err) {
                console.error("ファイルの取得に失敗しました。", err);
            }
        }
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleFileSelect = (selectedFileId) => {
        navigate(`/canvas/${selectedFileId}`, { state: { userId: userId } });
        handleMenuClose();
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const handleCloseNodeListModal = () => {
        setIsNodeListModalOpen(false);
    };

    const handleCreateNewFile = async () => {
        if (!newCanvasName.trim()) {
            alert('キャンバス名を入力してください。');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/files', {
                name: newCanvasName,
                userId: userId
            });
            const newFileId = response.data.id;

            navigate(`/canvas/${newFileId}`, { state: { userId, fileId: newFileId } });

            setIsCreateModalOpen(false);
            setNewCanvasName('');
            fetchFiles();
        } catch (error) {
            console.error('新規キャンバス作成エラー:', error);
            alert('新しいキャンバスの作成に失敗しました。');
        }
    };

    const fetchFiles = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/files/user/${userId}`);
            setUserFiles(response.data);
        } catch (error) {
            console.error('ファイルの取得エラー:', error);
        }
    };

    const handleSaveFileName = async () => {
        if (!currentFileName.trim()) {
            alert('ファイル名を入力してください。');
            setCurrentFileName(userFiles.find(file => file.id === fileId)?.name || '');
            setIsEditingFileName(false);
            return;
        }

        try {
            await axios.put(`http://localhost:8080/api/files/${fileId}`, { name: currentFileName });
            setIsEditingFileName(false);
            fetchFiles();
        } catch (error) {
            console.error('ファイル名の更新エラー:', error);
            alert('ファイル名の更新に失敗しました。');
            setCurrentFileName(userFiles.find(file => file.id === fileId)?.name || '');
            setIsEditingFileName(false);
        }
    };

    const handleExportAsImage = async () => {
        const defaultFileName = 'idea_canvas_export';
        const fileName = prompt('ファイル名を入力してください:', defaultFileName);
        
        if (!fileName) {
            return;
        }
    
        const input = document.getElementById('export-target'); 
    
        if (!input) {
            console.error('Export target element not found.');
            alert('エクスポート対象のキャンバスが見つかりません。');
            return;
        }
    
        try {
            const canvas = await html2canvas(input, {
                scale: 2, 
                useCORS: true 
            });
    
            const image = canvas.toDataURL('image/png');
    
            const link = document.createElement('a');
            link.href = image;
            link.download = `${fileName}.png`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('画像エクスポートに失敗しました:', error);
            alert('画像エクスポート中にエラーが発生しました。');
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 2, sm: 3 } }}>
                <Typography variant="h5">アイデアを読み込み中...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 2, sm: 3 } }}>
                <Typography variant="h5" color="error">{error}</Typography>
            </Container>
        );
    }

    return (
        <Box sx={{
            height: '100vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }}>
    
            <Box
                id="export-target"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isCreatingNode ? 'crosshair' : (toolMode === 'move' ? (isDraggingCanvas ? 'grabbing' : 'grab') : 'default'),
                    touchAction: toolMode === 'move' ? 'none' : 'auto'
                }}
            >
                {/* ノードと付箋のレンダリング */}
                {filteredIdeas.length > 0 && filteredIdeas.map((idea) => {
                    const isToolModeBlocked = toolMode === 'move' || isCreatingNode;
    
                    return (
                        <Box
                            key={idea.id}
                            // マウスイベント（デスクトップ用）
                            onMouseDown={(e) => !isToolModeBlocked && handleMouseDown(e, idea)}
                            onClick={(e) => {
                                if (isToolModeBlocked) return;
                                e.stopPropagation();
                                setSelectedNoteId(null);
                                setSelectedNodeId(prevId => prevId === idea.id ? null : idea.id);
                            }}
                            onDoubleClick={(e) => {
                                if (isToolModeBlocked) return;
                                handleNodeDoubleClick(e, idea);
                            }}
                            // タッチイベント（モバイル用）
                            onTouchStart={(e) => !isToolModeBlocked && handleNodeTouchStart(e, idea)}
                            onTouchMove={(e) => !isToolModeBlocked && handleNodeTouchMove(e, idea)}
                            onTouchEnd={(e) => !isToolModeBlocked && handleNodeTouchEnd(e, idea)}
                            sx={{
                                border: `2px solid ${idea.id === selectedNodeId ? 'blue' : 'black'}`,
                                cursor: toolMode === 'move' ? 'grab' : (selectedNodeId === idea.id ? 'grab' : 'pointer'),
                                position: 'absolute',
                                transform: `translate(${idea.posX + canvasOffset.x}px, ${idea.posY + canvasOffset.y}px)`,
                                p: { xs: 1, sm: 1.5 },
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                boxShadow: 1,
                                minWidth: { xs: '120px', sm: '150px' },
                                maxWidth: { xs: '200px', sm: '250px' },
                                touchAction: 'none', // タッチ時のブラウザデフォルト動作を無効化
                                userSelect: 'none'   // テキスト選択を無効化
                            }}
                        >
                            <Typography 
                                variant="h6"
                                sx={{ 
                                    fontSize: { xs: '0.9rem', sm: '1.1rem' },
                                    wordBreak: 'break-word',
                                    pointerEvents: 'none' // テキスト選択を防ぐ
                                }}
                            >
                                {idea.title}
                            </Typography>
                            <Typography 
                                variant="body2"
                                sx={{ 
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    wordBreak: 'break-word',
                                    mt: 0.5,
                                    pointerEvents: 'none' // テキスト選択を防ぐ
                                }}
                            >
                                {idea.description}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {idea.tags && idea.tags.map((tag, index) => (
                                    <Chip 
                                        key={`${idea.id}-${tag}-${index}`} 
                                        label={tag} 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: 'lightgray', 
                                            fontSize: { xs: '8px', sm: '10px' },
                                            height: { xs: '16px', sm: '20px' },
                                            pointerEvents: 'none' // タッチ操作を親要素に委譲
                                        }} 
                                    />
                                ))}
                            </Box>
                        </Box>
                    );
                })}
    
                    {notes.map((note) => {
                    return (
                        <Box
                            key={note.id}
                            onMouseDown={(e) => {
                                // テキスト編集中でなければドラッグ開始
                                if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
                                    if (toolMode !== 'move') {
                                        handleMouseDown(e, note);
                                    }
                                }
                            }}
                            onClick={(e) => {
                                if (toolMode === 'move' || isCreatingNode) return;
                                e.stopPropagation();
                                setSelectedNodeId(null);
                                setSelectedNoteId(prevId => prevId === note.id ? null : note.id);
                            }}
                            onTouchStart={(e) => {
                                if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
                                    if (toolMode !== 'move') {
                                        handleNodeTouchStart(e, note);
                                    }
                                }
                            }}
                            onTouchMove={(e) => {
                                if (toolMode !== 'move' && (draggingNote === note.id)) {
                                    handleNodeTouchMove(e, note);
                                }
                            }}
                            onTouchEnd={(e) => {
                                if (toolMode !== 'move' && (draggingNote === note.id)) {
                                    handleNodeTouchEnd(e, note);
                                }
                            }}
                            sx={{
                                position: 'absolute',
                                left: `${note.posX + canvasOffset.x}px`,
                                top: `${note.posY + canvasOffset.y}px`,
                                width: { xs: '140px', sm: '180px' },
                                minHeight: { xs: '100px', sm: '120px' },
                                bgcolor: '#ffeb3b',
                                boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
                                cursor: toolMode === 'move' ? 'grab' : (selectedNoteId === note.id ? 'grab' : 'pointer'),
                                border: `2px solid ${note.id === selectedNoteId ? '#1976d2' : '#f9a825'}`,
                                borderRadius: '2px',
                                transform: 'rotate(-1deg)',
                                display: 'flex',
                                alignItems: 'stretch',
                                '&:hover': {
                                    boxShadow: '3px 3px 10px rgba(0,0,0,0.2)'
                                }
                            }}
                        >
                            <TextField
                                variant="standard"
                                multiline
                                placeholder="付箋"
                                defaultValue={note.text === '付箋' ? '' : note.text}
                                onChange={(e) => {
                                    if (toolMode !== 'move') {
                                        handleNoteTextChange(e, note.id);
                                    }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onTouchStart={(e) => {
                                    e.stopPropagation();
                                }}
                                fullWidth
                                sx={{ 
                                    '& .MuiInput-root': {
                                        fontSize: { xs: '13px', sm: '14px' },
                                        padding: { xs: '8px', sm: '12px' },
                                        fontFamily: "'Indie Flower', cursive, sans-serif",
                                        lineHeight: 1.5,
                                        height: '100%',
                                        '&:before': {
                                            borderBottom: 'none'
                                        },
                                        '&:after': {
                                            borderBottom: 'none'
                                        },
                                        '&:hover:not(.Mui-disabled):before': {
                                            borderBottom: 'none'
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        color: '#424242',
                                        cursor: 'text',
                                        '&::placeholder': {
                                            color: '#9e9e9e',
                                            opacity: 0.6
                                        }
                                    }
                                }}
                                InputProps={{
                                    disableUnderline: true
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>
    
            {/* モバイル対応ツールバー - アイコンのみ */}
            <Box sx={{
                position: 'fixed',
                bottom: { xs: '10px', sm: '20px' },
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'background.paper',
                p: { xs: 0.5, sm: 1 },
                borderRadius: '8px',
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'row',
                gap: { xs: 0.5, sm: 1 }
            }}>
                {isMobile ? (
                    // モバイル: アイコンのみ
                    <>
                        <IconButton
                            onClick={() => setToolMode(toolMode === 'move' ? 'select' : 'move')}
                            sx={{ 
                                bgcolor: toolMode === 'move' ? 'secondary.main' : 'primary.main',
                                color: 'white',
                                width: { xs: '44px', sm: '48px' },
                                height: { xs: '44px', sm: '48px' },
                                '&:hover': { 
                                    bgcolor: toolMode === 'move' ? 'secondary.dark' : 'primary.dark' 
                                }
                            }}
                        >
                            <PanToolIcon sx={{ fontSize: { xs: '20px', sm: '24px' } }} />
                        </IconButton>
                        <IconButton
                            onClick={() => setToolMode(toolMode === 'createNode' ? 'select' : 'createNode')}
                            sx={{ 
                                bgcolor: toolMode === 'createNode' ? 'secondary.main' : 'primary.main',
                                color: 'white',
                                width: { xs: '44px', sm: '48px' },
                                height: { xs: '44px', sm: '48px' },
                                '&:hover': { 
                                    bgcolor: toolMode === 'createNode' ? 'secondary.dark' : 'primary.dark' 
                                }
                            }}
                        >
                            <AddCircleIcon sx={{ fontSize: { xs: '20px', sm: '24px' } }} />
                        </IconButton>
                        <IconButton
                            onClick={() => setToolMode(toolMode === 'createNote' ? 'select' : 'createNote')}
                            sx={{ 
                                bgcolor: toolMode === 'createNote' ? 'secondary.main' : 'primary.main',
                                color: 'white',
                                width: { xs: '44px', sm: '48px' },
                                height: { xs: '44px', sm: '48px' },
                                '&:hover': { 
                                    bgcolor: toolMode === 'createNote' ? 'secondary.dark' : 'primary.dark' 
                                }
                            }}
                        >
                            <NoteAddIcon sx={{ fontSize: { xs: '20px', sm: '24px' } }} />
                        </IconButton>
                    </>
                ) : (
                    // デスクトップ: テキスト付きボタン
                    <>
                        <Button
                            variant="contained"
                            onClick={() => setToolMode(toolMode === 'move' ? 'select' : 'move')}
                            color={toolMode === 'move' ? 'secondary' : 'primary'}
                            startIcon={<PanToolIcon />}
                        >
                            手のひらツール
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setToolMode(toolMode === 'createNode' ? 'select' : 'createNode')}
                            color={toolMode === 'createNode' ? 'secondary' : 'primary'}
                            startIcon={<AddCircleIcon />}
                        >
                            アイデアノード作成ツール
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setToolMode(toolMode === 'createNote' ? 'select' : 'createNote')}
                            color={toolMode === 'createNote' ? 'secondary' : 'primary'}
                            startIcon={<NoteAddIcon />}
                        >
                            付箋ツール
                        </Button>
                    </>
                )}
            </Box>
    
            {/* モバイル対応メニュー */}
            <Box
                sx={{
                    position: 'fixed',
                    top: { xs: '10px', sm: '15px' },
                    left: { xs: '10px', sm: '20px' },
                    zIndex: 1000,
                }}
            >
                <Box
                    sx={{
                        bgcolor: isMenuOpen ? 'primary.main' : 'background.paper',
                        borderRadius: '8px',
                        width: { xs: '40px', sm: '48px' },
                        height: { xs: '32px', sm: '40px' },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 3,
                        cursor: 'pointer',
                        transition: 'transform 0.1s ease-in-out',
                        '&:active': {
                            transform: 'scale(0.95)',
                        },
                    }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <MenuIcon 
                        sx={{ 
                            color: isMenuOpen ? 'white' : 'inherit',
                            fontSize: { xs: '18px', sm: '24px' }
                        }} 
                    />
                </Box>
    
                {isMenuOpen && (
                    <Box sx={{
                        position: 'absolute',
                        top: { xs: '40px', sm: '48px' },
                        left: 0,
                        bgcolor: 'background.paper',
                        p: { xs: 0.5, sm: 1 },
                        borderRadius: '8px',
                        boxShadow: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: { xs: 0.5, sm: 1 },
                        width: { xs: '160px', sm: '180px' },
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <Button
                            variant="contained"
                            onClick={handleMenuClick}
                            size={isMobile ? "small" : "medium"}
                            sx={{ 
                                fontSize: { xs: '12px', sm: '14px' }
                            }}
                        >
                            キャンバス
                        </Button>
                        
                        <Menu
                            anchorEl={anchorEl}
                            open={menuOpen}
                            onClose={handleMenuClose}
                            PaperProps={{
                                sx: {
                                    bgcolor: lighten(theme.palette.primary.main, 0.8),
                                    minWidth: { xs: '200px', sm: '250px' },
                                    maxHeight: '60vh',
                                    overflowY: 'auto'
                                }
                            }}
                        >
                            <MenuItem onClick={() => {
                                handleMenuClose();
                                setIsCreateModalOpen(true);
                            }}>
                                新規作成
                            </MenuItem>
                            {userFiles.length > 0 ? (
                                userFiles.map((file) => (
                                    <MenuItem
                                        key={file.id}
                                        sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            pr: 1,
                                            minHeight: { xs: '40px', sm: '48px' }
                                        }}
                                    >
                                        <Box 
                                            onClick={() => handleFileSelect(file.id)}
                                            sx={{ 
                                                flex: 1, 
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: { xs: '14px', sm: '16px' }
                                            }}
                                        >
                                            {file.name}
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFile(file.id, file.name);
                                            }}
                                            sx={{ ml: 1 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem onClick={handleMenuClose}>ファイルがありません</MenuItem>
                            )}
                        </Menu>
                        
                        <Button
                            variant="contained"
                            onClick={() => setIsNodeListModalOpen(true)}
                            size={isMobile ? "small" : "medium"}
                            sx={{ 
                                fontSize: { xs: '12px', sm: '14px' }
                            }}
                        >
                            ノード一覧
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleGoToNews}
                            size={isMobile ? "small" : "medium"}
                            sx={{ 
                                fontSize: { xs: '12px', sm: '14px' }
                            }}
                        >
                            News
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleExportAsImage}
                            size={isMobile ? "small" : "medium"}
                            sx={{ 
                                fontSize: { xs: '12px', sm: '14px' }
                            }}
                        >
                            エクスポート
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleLogout}
                            size={isMobile ? "small" : "medium"}
                            sx={{ 
                                fontSize: { xs: '12px', sm: '14px' }
                            }}
                        >                           
                            ログアウト
                        </Button>
                    </Box>
                )}
            </Box>
    
            {/* モバイル対応ファイル名編集 - 高さを統一 */}
            <Box
                sx={{
                    position: 'fixed',
                    top: { xs: '10px', sm: '15px' },
                    left: { xs: '55px', sm: '75px' },
                    right: { xs: '10px', sm: 'auto' },
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: { xs: '32px', sm: '40px' }
                }}
            >
                {isEditingFileName ? (
                    <TextField
                        value={currentFileName}
                        onChange={(e) => setCurrentFileName(e.target.value)}
                        onBlur={handleSaveFileName}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSaveFileName();
                            }
                        }}
                        autoFocus
                        size="small"
                        sx={{
                            bgcolor: 'background.paper',
                            borderRadius: '8px',
                            boxShadow: 3,
                            '& .MuiInputBase-root': {
                                height: { xs: '32px', sm: '40px' }
                            },
                            '& .MuiInputBase-input': {
                                fontSize: { xs: '14px', sm: '16px' },
                                py: { xs: '4px', sm: '8px' }
                            }
                        }}
                    />
                ) : (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        bgcolor: 'background.paper',
                        borderRadius: '8px',
                        boxShadow: 3,
                        px: { xs: 1, sm: 1.5 },
                        minHeight: { xs: '32px', sm: '40px' }
                    }}>
                        <Typography 
                            variant="h6" 
                            onClick={() => setIsEditingFileName(true)}
                            sx={{ 
                                fontSize: { xs: '14px', sm: '16px' },
                                cursor: 'pointer',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: { xs: '150px', sm: '300px' },
                                fontWeight: 500
                            }}
                        >
                            {currentFileName}
                        </Typography>
                        <IconButton 
                            onClick={() => setIsEditingFileName(true)} 
                            size="small"
                            sx={{ 
                                p: { xs: 0.25, sm: 0.5 }
                            }}
                        >
                            <CreateIcon sx={{ fontSize: { xs: '14px', sm: '18px' } }} />
                        </IconButton>
                    </Box>
                )}
            </Box>
    
            {/* モーダル類も次の更新で対応 */}
    
            {/* モバイル対応ノード編集モーダル */}
            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: '90vw', sm: '400px' },
                    maxWidth: '400px',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: { xs: 2, sm: 4 },
                    borderRadius: '8px',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}>
                    {editingIdea && (
                        <Box>
                            <Typography 
                                variant="h6" 
                                component="h2" 
                                sx={{ 
                                    mb: 2,
                                    fontSize: { xs: '18px', sm: '20px' }
                                }}
                            >
                                ノードの編集
                            </Typography>
                            <TextField
                                label="タイトル"
                                name="title"
                                value={editingIdea.title || ''}
                                placeholder="新しいアイデア"
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ 
                                    mb: 2,
                                    '& .MuiInputBase-input': {
                                        fontSize: { xs: '14px', sm: '16px' }
                                    }
                                }}
                                inputProps={{ maxLength: 255 }}
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                label="詳細"
                                name="description"
                                value={editingIdea.description || ''}
                                placeholder="ここを編集できます"
                                onChange={handleInputChange}
                                multiline
                                rows={isMobile ? 3 : 4}
                                fullWidth
                                sx={{ 
                                    mb: 2,
                                    '& .MuiInputBase-input': {
                                        fontSize: { xs: '14px', sm: '16px' }
                                    }
                                }}
                                size={isMobile ? "small" : "medium"}
                            />
                            <TextField
                                label="タグを入力 (Enterで追加)"
                                onKeyDown={handleTagInputKeyDown}
                                fullWidth
                                sx={{ 
                                    mb: 2,
                                    '& .MuiInputBase-input': {
                                        fontSize: { xs: '14px', sm: '16px' }
                                    }
                                }}
                                size={isMobile ? "small" : "medium"}
                            />
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {editingIdea.tags && editingIdea.tags.map(tag => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => handleDeleteTag(tag)}
                                        sx={{ 
                                            bgcolor: 'lightgray',
                                            fontSize: { xs: '12px', sm: '14px' },
                                            height: { xs: '24px', sm: '32px' }
                                        }}
                                        size={isMobile ? "small" : "medium"}
                                    />
                                ))}
                            </Box>
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'flex-end', 
                                gap: 1 
                            }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={handleCloseModal}
                                    fullWidth={isMobile}
                                    size={isMobile ? "small" : "medium"}
                                >
                                    キャンセル
                                </Button>
                                <Button 
                                    variant="contained" 
                                    onClick={handleUpdateIdea}
                                    fullWidth={isMobile}
                                    size={isMobile ? "small" : "medium"}
                                >
                                    更新
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Modal>
    
            {/* モバイル対応ノード一覧モーダル */}
            <Modal
                open={isNodeListModalOpen}
                onClose={handleCloseNodeListModal}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Box sx={{
                    width: { xs: '95vw', sm: '80%' },
                    height: { xs: '90vh', sm: '80%' },
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: { xs: 2, sm: 4 },
                    borderRadius: '8px',
                    overflowY: 'auto'
                }}>
                    <NodeListPage
                        ideas={ideas}
                        allTags={allTags}
                        onSelectIdea={(ideaId) => {
                            setSelectedNodeId(ideaId);
                            setIsNodeListModalOpen(false);
                        }}
                    />
                    <Button 
                        onClick={handleCloseNodeListModal} 
                        sx={{ mt: 2 }}
                        fullWidth={isMobile}
                        size={isMobile ? "small" : "medium"}
                    >
                        閉じる
                    </Button>
                </Box>
            </Modal>
    
            {/* モバイル対応新規キャンバス作成モーダル */}
            <Modal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                aria-labelledby="create-new-canvas-modal-title"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    p: { xs: 2, sm: 4 },
                    borderRadius: '8px',
                    boxShadow: 24,
                    width: { xs: '90vw', sm: '400px' },
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <Typography 
                        id="create-new-canvas-modal-title" 
                        variant="h6" 
                        component="h2"
                        sx={{ fontSize: { xs: '18px', sm: '20px' } }}
                    >
                        新しいキャンバスを作成
                    </Typography>
                    <TextField
                        label="キャンバス名"
                        variant="outlined"
                        fullWidth
                        value={newCanvasName}
                        onChange={(e) => setNewCanvasName(e.target.value)}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: { xs: '14px', sm: '16px' }
                            }
                        }}
                        size={isMobile ? "small" : "medium"}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleCreateNewFile}
                        fullWidth
                        size={isMobile ? "small" : "medium"}
                    >
                        作成
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
};

export default Canvas;