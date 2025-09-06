import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import CanvasPage from './pages/Canvas';
import PromptPage from './pages/PromptPage';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                {/* 💡 URLからuserIdを削除 */}
                <Route path="/canvas/:fileId" element={<CanvasPage />} />
                {/* 💡 URLからuserIdを削除 */}
                <Route path="/prompt/:fileId" element={<PromptPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;