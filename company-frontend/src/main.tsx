import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 1. 引入 BrowserRouter
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* 2. 用 BrowserRouter 包住 App */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
)

