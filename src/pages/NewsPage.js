// src/pages/NewsPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Button, List, ListItem, ListItemText, Snackbar, Alert, Grid, Link } from '@mui/material';
import axios from 'axios';

const NewsPage = () => {
    const { fileId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const userId = location.state?.userId;

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // 💡 ニュースデータを取得する関数を独立させる
    const fetchNews = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/news');
            const newsData = response.data.results;
            setNews(newsData);
        } catch (err) {
            setError('ニュースの取得に失敗しました。');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    // 💡 コンポーネントの初回マウント時にニュースを取得
    useEffect(() => {
        fetchNews();
    }, []);

    const handleCreateNode = async (newsItem) => {
        const newIdea = {
            title: `[News] ${newsItem.title}`,
            description: newsItem.description,
            userId: userId,
            fileId: fileId,
            nodeType: 'NEWS',
            tags: ['News'],
            posX: Math.random() * 200,
            posY: Math.random() * 200,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await axios.post('http://localhost:8080/api/ideas', newIdea);
            const createdNode = response.data;
            
            navigate(`/canvas/${fileId}`, {
                state: {
                    userId: userId,
                    fileId: fileId,
                    newNode: createdNode
                }
            });
            
        } catch (err) {
            setSnackbarMessage('ノードの作成に失敗しました。');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            console.error(err);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center">
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2 }}>ニュースを読み込み中...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h6" color="error">
                    {error}
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
            <Box sx={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: 1000,
            }}>
                <Button variant="outlined" onClick={handleGoBack}>
                    戻る
                </Button>
            </Box>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    News
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    最新のニュースから、アイデアのノードを作成できます。
                </Typography>
                {/* 💡 更新ボタンを追加 */}
                <Button variant="contained" onClick={fetchNews} sx={{ mt: 2 }}>
                    ニュースを更新
                </Button>
            </Box>
            <Box sx={{ 
                p: 2, // パディングを追加
                border: '1px solid #ddd', // ボーダーを追加
                borderRadius: '8px' // 角を丸くする
            }}>
                <List>
                {/* 💡 ニュースを3つに限定して表示 */}
                {news.slice(0, 3).map((item) => (
                    <ListItem key={item.article_id} sx={{ borderBottom: '1px solid #eee', py: 2 }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={12} sm={9}>
                                <ListItemText
                                    primary={<Link href={item.link} variant="h6" underline="hover" color="inherit" target="_blank" rel="noopener">{item.title}</Link>}
                                    secondary={item.description}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                <Button
                                    variant="contained"
                                    onClick={() => handleCreateNode(item)}
                                >
                                    ノードを作成
                                </Button>
                            </Grid>
                        </Grid>
                    </ListItem>
                ))}
                </List>
            </Box>
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default NewsPage;