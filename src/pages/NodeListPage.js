import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // 💡 useLocation, useNavigateを削除
import { Container, Typography, Box, CircularProgress, List, ListItem, ListItemText, Divider } from '@mui/material'; // 💡 Buttonを削除
import axios from 'axios';

// 💡 ユーザーIDとファイルIDをpropsとして受け取る
const NodeListPage = ({ userId, fileId }) => {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNodes = async () => {
            if (!userId) {
                // ...
                return;
            }

            try {
                // ... 既存のAPI呼び出しロジックはそのまま ...
            } catch (err) {
                // ...
            } finally {
                setLoading(false);
            }
        };

        fetchNodes();
    }, [fileId, userId]);

    // 💡 戻るボタンのロジックを削除

    if (loading) {
        // ...
    }

    if (error) {
        // ...
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    ノード一覧
                </Typography>
            </Box>
            
            <List sx={{ bgcolor: 'background.paper', border: '1px solid #ddd' }}>
                {nodes.length > 0 ? (
                    nodes.map(node => (
                        <React.Fragment key={node.id}>
                            <ListItem>
                                <ListItemText 
                                    primary={node.type === 'idea' ? node.title : `付箋: ${node.content ? node.content.substring(0, 20) + '...' : ''}`}
                                    secondary={node.type === 'idea' ? node.description : '付箋'}
                                />
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))
                ) : (
                    <ListItem>
                        <ListItemText primary="ノードはありません" />
                    </ListItem>
                )}
            </List>
        </Container>
    );
};

export default NodeListPage;