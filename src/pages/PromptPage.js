import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, CircularProgress, TextField } from '@mui/material';
import axios from 'axios';

const PromptPage = () => {
    const { fileId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const userId = location.state?.userId;

    const [ideas, setIdeas] = useState([]);
    const [promptText, setPromptText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIdeasAndGeneratePrompt = async () => {
            if (!userId) {
                setError("ユーザーIDがありません。ログインし直してください。");
                setLoading(false);
                return;
            }

            try {
                // 💡 ユーザーのアイデアノードを取得
                const response = await axios.get(`http://localhost:8080/api/ideas/file/${fileId}`);
                const fetchedIdeas = response.data;
                setIdeas(fetchedIdeas);

                // 💡 プロンプト生成ロジック
                let newPromptText = `ファイルID: ${fileId}\n\n`;
                newPromptText += fetchedIdeas.map(idea => 
                    `タイトル: ${idea.title}\n説明: ${idea.description}\nタグ: ${idea.tags ? idea.tags.join(', ') : 'なし'}`
                ).join('\n\n');

                setPromptText(newPromptText);

            } catch (err) {
                setError("データの取得に失敗しました。");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchIdeasAndGeneratePrompt();
    }, [fileId, userId]);

    const handleGoBack = () => {
        navigate(`/canvas/${fileId}`, { state: { userId: userId, fileId: fileId } });
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>プロンプトを生成中...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h5" color="error">{error}</Typography>
                <Button variant="contained" onClick={handleGoBack} sx={{ mt: 2 }}>
                    戻る
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    プロンプト作成画面
                </Typography>
                <Button variant="contained" onClick={handleGoBack}>
                    キャンバスに戻る
                </Button>
            </Box>
            
            <TextField
                label="生成されたプロンプト"
                multiline
                rows={15}
                fullWidth
                value={promptText}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
                このプロンプトをコピーしてAIツールに入力してください。
            </Typography>
        </Container>
    );
};

export default PromptPage;