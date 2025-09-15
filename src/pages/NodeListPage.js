import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, TextField, Grid } from '@mui/material';

const NodeListPage = ({ ideas, allTags, onSelectIdea }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredIdeas, setFilteredIdeas] = useState(ideas);
    const [selectedTags, setSelectedTags] = useState([]);

    useEffect(() => {
        let currentFilteredIdeas = ideas;

        // 💡 検索クエリによるフィルタリング
        if (searchQuery) {
            currentFilteredIdeas = currentFilteredIdeas.filter(idea =>
                idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                idea.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 💡 タグによるフィルタリング
        if (selectedTags.length > 0) {
            currentFilteredIdeas = currentFilteredIdeas.filter(idea =>
                idea.tags && idea.tags.some(tag => selectedTags.includes(tag))
            );
        }

        setFilteredIdeas(currentFilteredIdeas);
    }, [ideas, searchQuery, selectedTags]);

    const handleTagClick = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
                ノード一覧
            </Typography>
            
            <TextField
                label="検索"
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {allTags.map((tag) => (
                    <Chip
                        key={tag}
                        label={tag}
                        onClick={() => handleTagClick(tag)}
                        color={selectedTags.includes(tag) ? 'primary' : 'default'}
                        variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                    />
                ))}
            </Box>

            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {filteredIdeas.length > 0 ? (
                    filteredIdeas.map((idea) => (
                        <ListItem
                            key={idea.id}
                            button
                            onClick={() => onSelectIdea(idea.id)}
                            sx={{ borderBottom: '1px solid #eee' }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <ListItemText
                                        primary={idea.title}
                                        secondary={idea.description}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {idea.tags && idea.tags.map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                                sx={{ bgcolor: 'lightgray', fontSize: '10px' }}
                                            />
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                        </ListItem>
                    ))
                ) : (
                    <Typography sx={{ p: 2, textAlign: 'center' }}>
                        ノードが見つかりません。
                    </Typography>
                )}
            </List>
        </Box>
    );
};

export default NodeListPage;