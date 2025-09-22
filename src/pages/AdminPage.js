import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const loggedInUserId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
    
        if (!loggedInUserId || userRole !== 'ADMIN') {
            navigate('/login');
            return;
        }
    
        try {
            const response = await axios.get('http://localhost:8080/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            if (error.response && error.response.status === 403) {
                navigate('/login');
            }
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('本当にこのユーザーを削除しますか？')) {
            try {
                await axios.delete(`http://localhost:8080/api/users/${userId}`);
                fetchUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('ユーザーの削除に失敗しました。');
            }
        }
    };

    const handleOperateAsUser = async (user) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/files/user/${user.id}`);
            const fileId = response.data.length > 0 ? response.data[0].id : null;

            if (fileId) {
                navigate(`/canvas/${fileId}`);
            } else {
                console.warn("User has no files to operate.");
                alert('このユーザーにはファイルがありません。');
            }
        } catch (error) {
            console.error("Failed to operate as user:", error);
            alert('ユーザー操作に失敗しました。');
        }
    };

    const handleLogout = () => {
        // ローカルストレージをクリア
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        
        // ログインページにリダイレクト
        navigate('/login');
    };

    return (
        <Box sx={{ p: 4 }}>
            {/* ヘッダー部分 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    管理者ページ
                </Typography>
                <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={handleLogout}
                >
                    ログアウト
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ユーザー名</TableCell>
                            <TableCell>役割</TableCell>
                            <TableCell>登録日</TableCell>
                            <TableCell align="right">アクション</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleOperateAsUser(user)}
                                        sx={{ mr: 1 }}
                                    >
                                        ユーザーとして操作
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        削除
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AdminPage;