import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, Modal, Chip } from '@mui/material';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const Canvas = () => {
    const { fileId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const userId = location.state?.userId;

    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);
    const [toolMode, setToolMode] = useState('select'); 
    
    const [draggingNode, setDraggingNode] = useState(null);
    const [draggingNote, setDraggingNote] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
    
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState(null);
    
    const [notes, setNotes] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) {
                setError("ユーザーIDがありません。ログインし直してください。");
                setLoading(false);
                return;
            }
            try {
                // 💡 修正箇所：アイデアの取得のみに
            const ideasResponse = await axios.get(`http://localhost:8080/api/ideas/file/${fileId}`);
            setIdeas(ideasResponse.data);

            // 💡 付箋のデータを取得する部分は一時的に削除
            // const notesResponse = await axios.get(`http://localhost:8080/api/notes/file/${fileId}`);
            // setNotes(notesResponse.data);
            } catch (err) {
                setError("データの取得に失敗しました。");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fileId, userId]);

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
            if (isModalOpen || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
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
    }, [selectedNodeId, selectedNoteId, ideas, notes, isModalOpen]);

    const handleCanvasMouseDown = (e) => {
        setSelectedNodeId(null);
        setSelectedNoteId(null);

        if (toolMode === 'move') {
            setIsDraggingCanvas(true);
            setLastPosition({ x: e.clientX, y: e.clientY });
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
        if (isDraggingCanvas) {
            const dx = e.clientX - lastPosition.x;
            const dy = e.clientY - lastPosition.y;
            setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPosition({ x: e.clientX, y: e.clientY });
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

    // 💡 ツールの切り替えロジック
    const handleToggleMoveTool = () => {
        setIsCreatingNode(false);
        setToolMode(toolMode === 'move' ? 'select' : 'move');
        setSelectedNodeId(null);
        setSelectedNoteId(null);
    };

    const handleToggleCreateNode = () => {
        setIsCreatingNode(!isCreatingNode); // 💡 ここで状態を切り替える
        setToolMode(isCreatingNode ? 'select' : 'createNode'); // 💡 状態に合わせてツールモードを切り替える
        setSelectedNodeId(null);
        setSelectedNoteId(null);
    };
    
    // 💡 キャンバスのクリックイベント
    const handleCanvasClick = (e) => {
        if (isCreatingNode) {
            const canvasRect = e.currentTarget.getBoundingClientRect();
            const posX = e.clientX - canvasRect.left;
            const posY = e.clientY - canvasRect.top;

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
                setIsCreatingNode(false);
                setToolMode('select');
            })
            .catch(err => {
                console.error('ノード作成エラー:', err);
                alert('ノードの作成に失敗しました。');
            });
            
        } else {
            setSelectedNodeId(null);
            setSelectedNoteId(null);
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
    
    const handleGoToPrompt = () => {
        navigate(`/prompt/${fileId}`, { state: { userId: userId, fileId: fileId } });
    };

    const filteredIdeas = selectedTags.length > 0
        ? ideas.filter(idea => idea.tags && selectedTags.some(tag => idea.tags.includes(tag)))
        : ideas;

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
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1">
                キャンバス画面
            </Typography>
            <Typography variant="h6">
                ファイルID: {fileId} / ユーザーID: {userId}
            </Typography>

            <Box sx={{ my: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body1" sx={{ mr: 1, fontWeight: 'bold' }}>
                    タグフィルター:
                </Typography>
                {allTags.map(tag => (
                    <Chip
                        key={tag}
                        label={tag}
                        onClick={() => handleFilterTagClick(tag)}
                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                    />
                ))}
            </Box>

            <Box
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                sx={{
                    width: '100%',
                    height: '500px',
                    border: '1px solid gray',
                    position: 'relative',
                    overflow: 'hidden',
                    mt: 2,
                    cursor: isCreatingNode ? 'crosshair' : (toolMode === 'move' ? (isDraggingCanvas ? 'grabbing' : 'grab') : 'default')
                }}
            >
                {filteredIdeas.length > 0 && filteredIdeas.map((idea) => (
                    <Box 
                        key={idea.id} 
                        onMouseDown={(e) => toolMode !== 'move' && handleMouseDown(e, idea)}
                        onClick={(e) => {
                            if (toolMode === 'move' || isCreatingNode) return;
                            e.stopPropagation();
                            setSelectedNoteId(null);
                            setSelectedNodeId(prevId => prevId === idea.id ? null : idea.id);
                        }}
                        onDoubleClick={(e) => {
                            if (toolMode === 'move' || isCreatingNode) return;
                            handleNodeDoubleClick(e, idea);
                        }}
                        sx={{ 
                            border: `2px solid ${idea.id === selectedNodeId ? 'blue' : 'black'}`, 
                            cursor: toolMode === 'move' ? 'grab' : (selectedNodeId === idea.id ? 'grab' : 'pointer'),
                            position: 'absolute',
                            left: `${idea.posX + canvasOffset.x}px`,
                            top: `${idea.posY + canvasOffset.y}px`,
                        }}
                    >
                        <Typography variant="h6">{idea.title}</Typography>
                        <Typography variant="body2">{idea.description}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {idea.tags && idea.tags.map(tag => (
                                <Chip key={tag} label={tag} size="small" sx={{ bgcolor: 'lightgray', fontSize: '10px' }} />
                            ))}
                        </Box>
                    </Box>
                ))}

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
                    variant="outlined"
                    onClick={handleToggleMoveTool}
                    color={toolMode === 'move' ? 'primary' : 'inherit'}
                >
                    手のひらツール
                </Button>
                <Button variant="outlined">タグツール</Button>
                <Button 
                    variant="contained" 
                    onClick={handleToggleCreateNode}
                    color={isCreatingNode ? 'secondary' : 'primary'}
                >
                    アイデアノード作成ツール
                </Button>
                <Button variant="outlined" onClick={handleCreateNote}>
                    付箋ツール
                </Button>
                <Button 
                    variant="contained"
                    onClick={handleGoToPrompt}
                >
                    プロンプト作成
                </Button>
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
                                value={editingIdea.title}
                                onChange={handleInputChange}
                                fullWidth
                                sx={{ mb: 2 }}
                                inputProps={{ maxLength: 255 }}
                            />
                            <TextField
                                label="詳細"
                                name="description"
                                value={editingIdea.description}
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
        </Container>
    );
};

export default Canvas;