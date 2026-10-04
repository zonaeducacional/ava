import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import AssignmentPage from './pages/AssignmentPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import Grades from './pages/Grades.jsx';
import Meet from './pages/Meet.jsx';
import AdminUsers from './pages/AdminUsers.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública de autenticação */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas dentro do Layout principal */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route
              path="courses/:courseId/assignment/:assignmentId"
              element={<AssignmentPage />}
            />
            <Route
              path="courses/:courseId/quiz/:quizId"
              element={<QuizPage />}
            />
            <Route path="grades" element={<Grades />} />
            <Route path="meet" element={<Meet />} />
            <Route path="courses/:courseId/meet" element={<Meet />} />

            {/* Rota restrita exclusivamente ao perfil Administrador */}
            <Route
              path="admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirecionamento padrão para rotas inexistentes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
