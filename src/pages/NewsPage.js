// src/pages/NewsPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom'; // 💡 useNavigateを追加
import { Container, Typography, Box, CircularProgress, Button, List, ListItem, ListItemText, Snackbar, Alert, Grid, Link } from '@mui/material';
import axios from 'axios';

const NewsPage = () => {
    const { fileId } = useParams();
    const location = useLocation();
    const navigate = useNavigate(); // 💡 useNavigateフックを呼び出す
    const userId = location.state?.userId;

    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
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

        fetchNews();
    }, []);

    const handleCreateNode = async (newsItem) => {
        const newIdea = {
            title: `[News] ${newsItem.title}`,
            description: newsItem.description,
            userId: userId,
            fileId: fileId,
            nodeType: 'NEWS',
            posX: Math.random() * 200,
            posY: Math.random() * 200,
            tags: ['News'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await axios.post('http://localhost:8080/api/ideas', newIdea);
            setSnackbarMessage('ノードが正常に作成されました！');
            setSnackbarSeverity('success');
        } catch (err) {
            setSnackbarMessage('ノードの作成に失敗しました。');
            setSnackbarSeverity('error');
            console.error(err);
        } finally {
            setSnackbarOpen(true);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    // 💡 戻るボタンのハンドラー関数
    const handleGoBack = () => {
        navigate(-1); // 💡 一つ前の履歴に戻る
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
        <Container maxWidth="md" sx={{ mt: 4 }}>
            {/* 💡 戻るボタンを追加 */}
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
            </Box>
            <List>
                {news.map((item) => (
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
            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default NewsPage;