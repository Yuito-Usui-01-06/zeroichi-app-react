import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField } from '@mui/material';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const Home = () => {
  const location = useLocation();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newFileName, setNewFileName] = useState('');

  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDescription, setNewIdeaDescription] = useState('');

  // ログイン成功時に渡されたユーザーIDを取得（仮実装）
  // 実際は、トークンやセッションから取得する方が安全です
  const userId = location.state?.userId; 

  useEffect(() => {
    const fetchIdeas = async () => {
      if (!userId) {
        setError("ユーザーIDがありません。ログインし直してください。");
        setLoading(false);
        return;
      }
      try {
        // バックエンドのAPIを呼び出して、アイデアを取得
        const response = await axios.get(`http://localhost:8080/api/ideas/user/${userId}`);
        setIdeas(response.data);
      } catch (err) {
        setError("アイデアの取得に失敗しました。");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [userId]); // userIdが変更されるたびに再実行

  const handleCreateFile = async () => {
    if (!newFileName.trim()) {
      alert('ファイル名を入力してください。');
      return;
    }
    try {
      const newFile = {
        name: newFileName,
        userId: userId, // ログイン中のユーザーIDを渡す
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // バックエンドのファイル作成APIを呼び出す
      const response = await axios.post('http://localhost:8080/api/files', newFile);
      console.log('新しいファイルが作成されました:', response.data);
      alert(`「${response.data.name}」が作成されました！`);
      setNewFileName(''); // フォームをリセット

      // 作成されたファイル情報を元に、次のステップに進む
      // ...
      
    } catch (err) {
        console.error('ファイル作成エラー:', err);
        setError('ファイルの作成に失敗しました。');
      }
    };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5">読み込み中...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ようこそ、ホワイトボードへ！
        </Typography>
        <Typography variant="body1">
          あなたのアイデア一覧
        </Typography>

        {/* ファイル作成フォーム */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h6">新しいホワイトボードを作成</Typography>
          <TextField
            label="ホワイトボード名"
            variant="outlined"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleCreateFile}
          >
            作成
          </Button>
        </Box>

        {ideas.length > 0 ? (
          <ul>
            {ideas.map((idea) => (
              <li key={idea.id}>
                <Typography variant="h6">{idea.title}</Typography>
                <Typography variant="body2">{idea.description}</Typography>
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body1" sx={{ mt: 4 }}>
            まだアイデアがありません。
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default Home;