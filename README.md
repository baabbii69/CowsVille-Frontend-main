# 🐮 Cowsville Frontend

A modern, high-performance dashboard for managing dairy farm operations, built with **React**, **Vite**, and **Tailwind CSS**.

## 🚀 Tech Stack

- **Framework:** [React](https://react.dev/) (v18) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [clsx](https://github.com/lukeed/clsx)
- **State Management:** [React Query](https://tanstack.com/query/latest) (v5) + Context API
- **Routing:** [React Router](https://reactrouter.com/) (v6)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **HTTP Client:** [Axios](https://axios-http.com/)

## ✨ Key Features

- **📊 Interactive Dashboard:** Real-time overview of total cows, milking status, and daily milk production.
- **🐄 Livestock Management:** Detailed registry of all cows with search, filtering, and individual health records.
- **🏡 Farm Management:** Comprehensive view of all farms, including housing types and owner details.
- **📈 Analytics:** Visual performance metrics for clusters and milk production.
- **🔐 Secure Authentication:** Token-based authentication with automatic session handling.
- **🎨 Premium UI/UX:**
  - Dark/Light mode support (system preference).
  - Custom "Inline" and "Full Screen" loading animations.
  - Responsive design for mobile, tablet, and desktop.

## 🛠️ Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/baabbii69/CowsVille-Frontend-main.git
    cd cowsville-frontendd
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory (optional, defaults are set in `services/api.ts`):

    ```env
    VITE_API_URL=https://apiv3.cowsville-aau-cvma.com/api
    ```

4.  **Run Development Server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

5.  **Build for Production:**
    ```bash
    npm run build
    ```

## 📂 Project Structure

```
src/
├── assets/          # Static assets (logos, images)
├── components/
│   ├── layout/      # Layout wrappers (Sidebar, Header)
│   └── ui/          # Reusable UI components (Buttons, Cards, Loader)
├── context/         # Global state (Auth, Toast)
├── pages/           # Main application pages
├── services/        # API service definitions
└── types.ts         # TypeScript interfaces
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

Built with ❤️ for Cowsville.
