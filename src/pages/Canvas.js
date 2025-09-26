import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, Modal, Chip, Menu, MenuItem, lighten, useTheme } from '@mui/material';
import axios from 'axios';
import NodeListPage from './NodeListPage';
import IconButton from '@mui/material/IconButton';
import CreateIcon from '@mui/icons-material/Create';
import html2canvas from 'html2canvas';

const Canvas = () => {
    const { fileId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId') || localStorage.getItem('tempUserId');

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
    const theme = useTheme();

    const [isEditingFileName, setIsEditingFileName] = useState(false);
    const [currentFileName, setCurrentFileName] = useState('');

    const newNodeFromNews = location.state?.newNodeFromNews;
    const nodeCreatedFromNews = location.state?.nodeCreated;

    // 💡 ファイル名を取得するための関数を追加
    const fetchFileName = async (id) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/files/${id}`);
            setCurrentFileName(response.data.name);
        } catch (error) {
            console.error('ファイル名の取得エラー:', error);
        }
    };

    // 💡 tempUserIdは一度使用したら削除する
    useEffect(() => {
        localStorage.removeItem('tempUserId');
    }, []);
    
    // 💡 fileIdまたはuserIdが変更されたときにデータを取得
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

                // 💡 News画面から渡された新規ノード情報を取得
                const newNode = location.state?.newNode;

                if (newNode) {
                    // 💡 新規ノードを編集状態に設定し、モーダルを表示
                    setEditingIdea({ ...newNode, tags: newNode.tags || [] });
                    setIsModalOpen(true);
                    
                    // 履歴のstateをクリア
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
    }, [fileId, userId, location.state, navigate]); // 💡 fileIdとuserIdを依存配列に追加

    useEffect(() => {
        if (newNodeFromNews) {
            const createAndEditNode = async () => {
                try {
                    // 💡 新規ノードをサーバーに登録
                    const response = await axios.post('http://localhost:8080/api/ideas', {
                        ...newNodeFromNews,
                        posX: Math.random() * 200,
                        posY: Math.random() * 200,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    
                    const newIdea = response.data;
                    setIdeas([...ideas, newIdea]);
                    
                    // 💡 作成したノードを編集状態に設定
                    setEditingIdea({ ...newIdea, tags: newIdea.tags || [] });
                    setIsModalOpen(true);
                } catch (err) {
                    console.error('ノード作成エラー:', err);
                    // エラーハンドリング
                }
            };
            createAndEditNode();

            // 💡 stateをリセットして、再読み込み時にモーダルが再度表示されるのを防ぐ
            navigate(`/canvas/${fileId}`, { replace: true, state: { userId: userId, fileId: fileId } });
        }
    }, [newNodeFromNews]);

    useEffect(() => {
        if (nodeCreatedFromNews) {
            // ここで追加したノードの編集モーダルを開くなど、
            // 追加のロジックを実装することができます。
            // 例: alert('新しいノードが追加されました');
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

    const handleToggleMoveTool = () => {
        setIsCreatingNode(false);
        setToolMode(toolMode === 'move' ? 'select' : 'move');
        setSelectedNodeId(null);
        setSelectedNoteId(null);
    };

    const handleToggleCreateNode = () => {
        setIsCreatingNode(!isCreatingNode);
        setToolMode(isCreatingNode ? 'select' : 'createNode');
        setSelectedNodeId(null);
        setSelectedNoteId(null);
    };

    const handleCanvasClick = (e) => {
        // ツールがアクティブでない場合はノードの選択を解除
        if (toolMode === 'select' || e.target.closest('.MuiButtonBase-root')) {
            setSelectedNodeId(null);
            setSelectedNoteId(null);
            return;
        }

        const canvasRect = e.currentTarget.getBoundingClientRect();
        const posX = e.clientX - canvasRect.left - canvasOffset.x;
        const posY = e.clientY - canvasRect.top - canvasOffset.y;

        // 💡 アイデアノード作成ツールのロジック
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
                    setToolMode('select'); // ツールをリセット
                })
                .catch(err => {
                    console.error('ノード作成エラー:', err);
                    alert('ノードの作成に失敗しました。');
                });
        }

        // 💡 付箋ツールのロジック
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
                    setToolMode('select'); // ツールをリセット
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

    const handleCreateNote = async () => {
        try {
            const newNote = {
                text: '付箋',
                posX: Math.random() * 200,
                posY: Math.random() * 200,
                userId: userId,
                fileId: fileId
            };
            const response = await axios.post('http://localhost:8080/api/notes', newNote);
            setNotes([...notes, response.data]);
        } catch (err) {
            console.error('付箋作成エラー:', err);
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
        // 💡 変換確定のエンターキー（キーコード229）を無視する
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

    const handleFilterTagClick = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
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
        // 💡 1. ユーザーにファイル名を入力させる
        const defaultFileName = 'idea_canvas_export';
        const fileName = prompt('ファイル名を入力してください:', defaultFileName);
        
        // ユーザーがキャンセルした場合や空の文字列だった場合
        if (!fileName) {
            return; // 処理を中断
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
            // 💡 2. ダウンロード時のファイル名にユーザーの入力を反映
            link.href = image;
            link.download = `${fileName}.png`; // 入力されたファイル名を使用
            
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
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Typography variant="h5">アイデアを読み込み中...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
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
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: isCreatingNode ? 'crosshair' : (toolMode === 'move' ? (isDraggingCanvas ? 'grabbing' : 'grab') : 'default')
                }}
            >
                {/* ノードと付箋のレンダリング */}
                {filteredIdeas.length > 0 && filteredIdeas.map((idea) => {
                    const isToolModeBlocked = toolMode === 'move' || isCreatingNode;
    
                    return (
                        <Box
                            key={idea.id}
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
                            sx={{
                                border: `2px solid ${idea.id === selectedNodeId ? 'blue' : 'black'}`,
                                cursor: toolMode === 'move' ? 'grab' : (selectedNodeId === idea.id ? 'grab' : 'pointer'),
                                position: 'absolute',
                                transform: `translate(${idea.posX + canvasOffset.x}px, ${idea.posY + canvasOffset.y}px)`,
                            }}
                        >
                            <Typography variant="h6">{idea.title}</Typography>
                            <Typography variant="body2">{idea.description}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {idea.tags && idea.tags.map((tag, index) => (
                                    <Chip key={`${idea.id}-${tag}-${index}`} label={tag} size="small" sx={{ bgcolor: 'lightgray', fontSize: '10px' }} />
                                ))}
                            </Box>
                        </Box>
                    );
                })}
    
                {notes.map((note) => (
                    <Box
                        key={note.id}
                        onMouseDown={(e) => toolMode !== 'move' && handleMouseDown(e, note)}
                        onClick={(e) => {
                            if (toolMode === 'move' || isCreatingNode) return;
                            e.stopPropagation();
                            setSelectedNodeId(null);
                            setSelectedNoteId(prevId => prevId === note.id ? null : note.id);
                        }}
                        sx={{
                            position: 'absolute',
                            left: `${note.posX + canvasOffset.x}px`,
                            top: `${note.posY + canvasOffset.y}px`,
                            p: 1,
                            bgcolor: 'yellow',
                            boxShadow: 1,
                            cursor: toolMode === 'move' ? 'grab' : (selectedNoteId === note.id ? 'grab' : 'pointer'),
                            border: `2px solid ${note.id === selectedNoteId ? 'blue' : 'black'}`,
                        }}
                    >
                        <TextField
                            variant="outlined"
                            multiline
                            defaultValue={note.text}
                            onChange={(e) => {
                                if (toolMode !== 'move') {
                                    handleNoteTextChange(e, note.id);
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (toolMode === 'move') {
                                    e.preventDefault();
                                }
                            }}
                            sx={{ width: '150px' }}
                        />
                    </Box>
                ))}
            </Box>
    
            <Box sx={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'background.paper',
                p: 1,
                borderRadius: '8px',
                boxShadow: 3,
                display: 'flex',
                gap: 1
            }}>
                <Button
                    variant="contained"
                    onClick={() => setToolMode(toolMode === 'move' ? 'select' : 'move')}
                    color={toolMode === 'move' ? 'secondary' : 'primary'}
                >
                    手のひらツール
                </Button>
                <Button
                    variant="contained"
                    onClick={() => setToolMode(toolMode === 'createNode' ? 'select' : 'createNode')}
                    color={toolMode === 'createNode' ? 'secondary' : 'primary'}
                >
                    アイデアノード作成ツール
                </Button>
                <Button
                    variant="contained"
                    onClick={() => setToolMode(toolMode === 'createNote' ? 'select' : 'createNote')}
                    color={toolMode === 'createNote' ? 'secondary' : 'primary'}
                >
                    付箋ツール
                </Button>
            </Box>
    
            <Box
                sx={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    width: 'auto',
                    height: 'auto',
                    overflow: 'visible',
                    userSelect: 'none',
                }}
            >
                <Box
                    sx={{
                        bgcolor: isMenuOpen ? 'primary.main' : 'background.paper',
                        p: 1,
                        borderRadius: '50%',
                        width: '25px',
                        height: '25px',
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
                    <Typography
                        variant="h6"
                        sx={{
                            color: isMenuOpen ? 'white' : 'inherit',
                            userSelect: 'none',
                        }}
                    >
                        〇
                    </Typography>
                </Box>
    
                {isMenuOpen && (
                    <Box sx={{
                        position: 'absolute',
                        top: '50px',
                        left: 0,
                        bgcolor: 'background.paper',
                        p: 1,
                        borderRadius: '8px',
                        boxShadow: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        transition: 'opacity 0.3s ease-in-out',
                        opacity: isMenuOpen ? 1 : 0,
                        visibility: isMenuOpen ? 'visible' : 'hidden',
                        width: '180px',
                        height: 'auto',
                    }}>
                        <Button
                            variant="contained"
                            onClick={handleMenuClick}
                            color={isMenuOpen ? 'primary' : 'inherit'}
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
                                }
                            }}
                        >
                            <MenuItem onClick={() => {
                                handleMenuClose();
                                setIsCreateModalOpen(true);
                            }}
                            >
                                新規作成
                            </MenuItem>
                            {userFiles.length > 0 ? (
                                userFiles.map((file) => (
                                    <MenuItem
                                        key={file.id}
                                        onClick={() => handleFileSelect(file.id)}
                                    >
                                        {file.name}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem onClick={handleMenuClose}>ファイルがありません</MenuItem>
                            )}
                        </Menu>
                        <Button
                            variant="contained"
                            onClick={() => setIsNodeListModalOpen(true)}
                            color={isMenuOpen ? 'primary' : 'inherit'}
                        >
                            ノード一覧
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleGoToNews}
                            color={isMenuOpen ? 'primary' : 'inherit'}
                        >
                            News
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleExportAsImage}
                        >
                            エクスポート
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleLogout}
                        >                           
                            ログアウト
                        </Button>
                    </Box>
                )}
            </Box>
    
            <Box
                sx={{
                    position: 'fixed',
                    top: '15px',
                    left: '80px',
                    zIndex: 100,
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: '8px',
                    boxShadow: 3,
                    userSelect: 'none',
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
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" onClick={() => setIsEditingFileName(true)}>
                            {currentFileName}
                        </Typography>
                        <IconButton onClick={() => setIsEditingFileName(true)} size="small">
                            <CreateIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>
    
            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: '8px'
                }}>
                    {editingIdea && (
                        <Box>
                            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                                ノードの編集
                            </Typography>
                            <TextField
                                label="タイトル"
                                name="title"
                                placeholder="新しいアイデア"
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                inputProps={{ maxLength: 255 }}
                            />
                            <TextField
                                label="詳細"
                                name="description"
                                placeholder="ここを編集できます"
                                onChange={handleInputChange}
                                multiline
                                rows={4}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="タグを入力 (Enterで追加)"
                                onKeyDown={handleTagInputKeyDown}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {editingIdea.tags && editingIdea.tags.map(tag => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => handleDeleteTag(tag)}
                                        sx={{ bgcolor: 'lightgray' }}
                                    />
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button variant="outlined" onClick={handleCloseModal}>
                                    キャンセル
                                </Button>
                                <Button variant="contained" onClick={handleUpdateIdea}>
                                    更新
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Modal>
    
            <Modal
                open={isNodeListModalOpen}
                onClose={handleCloseNodeListModal}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Box sx={{
                    width: '80%',
                    height: '80%',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
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
                    <Button onClick={handleCloseNodeListModal} sx={{ mt: 2 }}>
                        閉じる
                    </Button>
                </Box>
            </Modal>
    
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
                    p: 4,
                    borderRadius: '8px',
                    boxShadow: 24,
                    width: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <Typography id="create-new-canvas-modal-title" variant="h6" component="h2">
                        新しいキャンバスを作成
                    </Typography>
                    <TextField
                        label="キャンバス名"
                        variant="outlined"
                        fullWidth
                        value={newCanvasName}
                        onChange={(e) => setNewCanvasName(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleCreateNewFile}>
                        作成
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
};

export default Canvas;