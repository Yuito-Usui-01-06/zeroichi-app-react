import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import CanvasPage from './pages/Canvas';
import NewsPage from './pages/NewsPage';
import AdminPage from './pages/AdminPage';

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                {/* 💡 URLからuserIdを削除 */}
                <Route path="/canvas/:fileId" element={<CanvasPage />} />
                {/* 💡 URLからuserIdを削除 */}
                <Route path="/news/:fileId" element={<NewsPage />} />
                {/* 💡 AdminPageへの新しいルートを追加 */}
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;