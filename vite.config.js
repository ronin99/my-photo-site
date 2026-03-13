import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 添加下面这行，替换成您的仓库名！前后都要有斜杠
  base: '/my-photo-site/', 
})