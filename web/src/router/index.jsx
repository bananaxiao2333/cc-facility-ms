import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import ClusterPage from "../pages/ClusterPage";
import GroupsPage from "../pages/GroupsPage";
import ActionsPage from "../pages/ActionsPage";
import WorkflowsPage from "../pages/WorkflowsPage";
import OpsPage from "../pages/OpsPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "../components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "ops", element: <OpsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "cluster", element: <ClusterPage /> },
      { path: "groups", element: <GroupsPage /> },
      { path: "actions", element: <ActionsPage /> },
      { path: "workflows", element: <WorkflowsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
