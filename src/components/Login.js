// src/components/Login.js

import React, { useState, useEffect  } from 'react';
import { Container, TextField, Button, Typography, Box, Link } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatchError, setPasswordsMatchError] = useState('');
  const passwordsMatch = password === confirmPassword;
  const navigate = useNavigate();

  useEffect(() => {
    setUsername('');
    setPassword('');
    setEmail('');
    setConfirmPassword('');
  }, [isLogin]);

  useEffect(() => {
    if (isLogin) {
      return;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      setPasswordsMatchError('パスワードが一致しません。');
    } else {
      setPasswordsMatchError('');
    }
  }, [password, confirmPassword, isLogin]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const user = { username, password, email };

    if (isLogin) {
      try {
        const response = await axios.post('http://localhost:8080/api/login', { username, password });
        const loggedInUser = response.data;
        const userId = loggedInUser.userId;

        // 💡 ログイン成功後、既存のファイルをチェックするAPIを呼び出す
        const filesResponse = await axios.get(`http://localhost:8080/api/files/user/${userId}`);
        const files = filesResponse.data;

        let fileId;
        if (files.length === 0) {
          // 💡 既存ファイルがない場合、新規ファイルを作成
          const newFileResponse = await axios.post('http://localhost:8080/api/files', {
            name: 'My First Canvas',
            userId: userId
          });
          fileId = newFileResponse.data.id;
        } else {
          // 💡 既存ファイルがある場合、一番古いファイルにリダイレクト
          fileId = files[0].id;
        }

        navigate(`/canvas/${fileId}`, { state: { userId: userId, fileId: fileId } });

      } catch (error) {
        console.error('ログインエラー:', error);
        if (error.response && error.response.data) {
          alert(error.response.data);
        } else {
          alert('ログインに失敗しました。');
        }
      }
    } else {
      try {
        const response = await axios.post('http://localhost:8080/api/register', user);
        console.log('サーバーからの応答:', response.data);
        alert('ユーザー登録が成功しました！');
      } catch (error) {
        console.error('エラー:', error);
        if (error.response && error.response.status === 400) {
          alert(error.response.data);
        } else {
          alert('ユーザー登録に失敗しました。予期せぬエラーです。');
        }
      }
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          {isLogin ? 'ログイン' : '新規登録'}
        </Typography>
        <Box noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="ユーザー名"
            name="username"
            autoComplete="off"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="パスワード"
            type="password"
            id="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
            {!isLogin && (
                <>
                    <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="パスワード（確認用）"
                    type="password"
                    id="confirmPassword"
                    autoComplete="off"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!passwordsMatchError}
                    helperText={passwordsMatchError}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="メールアドレス"
                        name="email"
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </>
            )}
          <Button
            type="button"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleSubmit}
            disabled={!isLogin && (!passwordsMatch || !username || !email || !password || !confirmPassword)}
          >
            {isLogin ? 'ログイン' : '新規登録'}
          </Button>
          <Box display="flex" justifyContent="center">
            <Link component="button" variant="body2" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? '新規登録はこちら' : 'ログイン画面に戻る'}
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;