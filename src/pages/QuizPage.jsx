import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { quizService, courseService, enrollmentService } from '../services/index.js';

export default function QuizPage() {
  const { courseId, quizId } = useParams();
  const { user, isStudent, isTeacher, isAdmin } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modo Professor: 'view' ou 'edit'
  const [editorMode, setEditorMode] = useState(false);
  const [editableQuiz, setEditableQuiz] = useState(null);
  const [savingEditor, setSavingEditor] = useState(false);
  const [editorSuccessMsg, setEditorSuccessMsg] = useState('');

  // Modo Aluno: Respostas e Tentativas
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const canEdit = isTeacher || isAdmin;

  useEffect(() => {
    loadQuizData();
  }, [quizId, user]);

  const loadQuizData = async () => {
    setLoading(true);
    setError('');
    try {
      let quizData = await quizService.getQuiz(quizId);
      if (!quizData) {
        quizData = await quizService.getQuizByItem(quizId);
      }

      if (!quizData) {
        setError('Quiz não encontrado.');
        setLoading(false);
        return;
      }

      setQuiz(quizData);
      setEditableQuiz(JSON.parse(JSON.stringify(quizData)));

      const courseData = await courseService.getCourseById(quizData.courseId || courseId);
      setCourse(courseData);

      if (isStudent) {
        const studentAttempts = await quizService.getStudentAttempts(quizData.id, user.id);
        setAttempts(studentAttempts);
      }
    } catch (err) {
      setError('Erro ao carregar quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manipulação de respostas pelo aluno
  const handleSelectAnswer = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return;

    // Verifica se respondeu todas
    const unanswered = quiz.questions.find((q) => !selectedAnswers[q.id]);
    if (unanswered) {
      alert('Por favor, responda a todas as questões antes de enviar o quiz.');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const result = await quizService.submitQuizAttempt(
        quiz.id,
        user.id,
        user.name,
        selectedAnswers
      );
      setLastResult(result);

      // Marca o item como concluído no progresso do curso se o quiz tiver item associado
      if (quiz.itemId) {
        await enrollmentService.toggleItemCompleted(user.id, quiz.courseId || courseId, quiz.itemId);
      }

      // Atualiza lista de tentativas
      const updatedAttempts = await quizService.getStudentAttempts(quiz.id, user.id);
      setAttempts(updatedAttempts);
      setSelectedAnswers({});
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Funções do Editor de Quiz (Professor)
  const handleAddQuestion = () => {
    const newQ = {
      id: 'q-' + Date.now(),
      text: 'Nova questão de múltipla escolha',
      points: 5,
      options: [
        { id: 'opt-' + Date.now() + '-1', text: 'Alternativa A', isCorrect: true },
        { id: 'opt-' + Date.now() + '-2', text: 'Alternativa B', isCorrect: false }
      ]
    };
    setEditableQuiz((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQ]
    }));
  };

  const handleRemoveQuestion = (qIndex) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex)
    }));
  };

  const handleQuestionTextChange = (qIndex, text) => {
    setEditableQuiz((prev) => {
      const updated = [...prev.questions];
      updated[qIndex].text = text;
      return { ...prev, questions: updated };
    });
  };

  const handleAddOption = (qIndex) => {
    setEditableQuiz((prev) => {
      const updated = [...prev.questions];
      const optId = 'opt-' + Date.now() + '-' + (updated[qIndex].options.length + 1);
      updated[qIndex].options.push({
        id: optId,
        text: `Nova Opção ${updated[qIndex].options.length + 1}`,
        isCorrect: false
      });
      return { ...prev, questions: updated };
    });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    setEditableQuiz((prev) => {
      const updated = [...prev.questions];
      if (updated[qIndex].options.length <= 2) {
        alert('Uma questão precisa ter pelo menos 2 alternativas.');
        return prev;
      }
      updated[qIndex].options = updated[qIndex].options.filter((_, idx) => idx !== optIndex);
      return { ...prev, questions: updated };
    });
  };

  const handleOptionTextChange = (qIndex, optIndex, text) => {
    setEditableQuiz((prev) => {
      const updated = [...prev.questions];
      updated[qIndex].options[optIndex].text = text;
      return { ...prev, questions: updated };
    });
  };

  const handleSetCorrectOption = (qIndex, optIndex) => {
    setEditableQuiz((prev) => {
      const updated = [...prev.questions];
      updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === optIndex
      }));
      return { ...prev, questions: updated };
    });
  };

  const handleSaveQuizChanges = async (e) => {
    e.preventDefault();
    setSavingEditor(true);
    setEditorSuccessMsg('');
    try {
      // Valida se cada questão tem pelo menos 1 opção correta
      for (let i = 0; i < (editableQuiz.questions || []).length; i++) {
        const q = editableQuiz.questions[i];
        const hasCorrect = q.options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          throw new Error(`A questão ${i + 1} precisa ter uma opção correta selecionada.`);
        }
      }

      await quizService.updateQuiz(quiz.id, {
        title: editableQuiz.title,
        description: editableQuiz.description,
        maxAttempts: Number(editableQuiz.maxAttempts),
        questions: editableQuiz.questions
      });

      setQuiz(JSON.parse(JSON.stringify(editableQuiz)));
      setEditorSuccessMsg('Quiz atualizado com sucesso!');
      setTimeout(() => setEditorSuccessMsg(''), 3000);
      setEditorMode(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingEditor(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }}>
        <div className="alert alert-error">{error || 'Quiz não encontrado.'}</div>
        <Link to={`/courses/${courseId}`} className="btn btn-secondary">
          Voltar para o Curso
        </Link>
      </div>
    );
  }

  const attemptsLeft = quiz.maxAttempts - attempts.length;
  const canTakeQuiz = isStudent && attemptsLeft > 0;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/courses/${quiz.courseId || courseId}`} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ← Voltar ao curso {course?.title ? `(${course.title})` : ''}
        </Link>

        {canEdit && (
          <button
            type="button"
            className={`btn btn-sm ${editorMode ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => {
              setEditorMode(!editorMode);
              setEditableQuiz(JSON.parse(JSON.stringify(quiz)));
            }}
          >
            {editorMode ? '👁️ Ver Quiz do Aluno' : '✏️ Editar Questões do Quiz'}
          </button>
        )}
      </div>

      {editorSuccessMsg && <div className="alert alert-success">{editorSuccessMsg}</div>}

      {/* CABEÇALHO DO QUIZ */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="course-card-top">
          <span className="item-type-badge type-quiz">Quiz Interativo</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {quiz.questions?.length || 0} Questões • Máximo 10,0 pontos
          </span>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.5rem 0' }}>
          {quiz.title}
        </h1>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
          {quiz.description}
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <span>Limite de tentativas: <strong>{quiz.maxAttempts}</strong></span>
          {isStudent && (
            <span>Tentativas restantes: <strong>{Math.max(0, attemptsLeft)}</strong></span>
          )}
          {bestScore !== null && (
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>
              Sua Melhor Nota: {bestScore} / 10,0
            </span>
          )}
        </div>
      </div>

      {/* RESULTADO DA ÚLTIMA TENTATIVA ENVIADA */}
      {lastResult && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            backgroundColor: 'var(--success-light)',
            borderColor: 'var(--success-border)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem' }}>🎉</div>
          <h2 style={{ color: 'var(--success)', fontSize: '1.35rem', margin: '0.5rem 0' }}>
            Quiz Concluído com Sucesso!
          </h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Nota Obtida: {lastResult.score} / 10,0 ({lastResult.percentage}%)
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Sua nota foi gravada no boletim oficial da disciplina.
          </p>
        </div>
      )}

      {/* MODO 1: EDITOR DO PROFESSOR */}
      {canEdit && editorMode ? (
        <form onSubmit={handleSaveQuizChanges}>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Configurações Gerais do Quiz
            </h2>
            <div className="form-group">
              <label className="form-label">Título do Quiz</label>
              <input
                type="text"
                className="form-input"
                value={editableQuiz.title}
                onChange={(e) => setEditableQuiz({ ...editableQuiz, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={editableQuiz.description}
                onChange={(e) => setEditableQuiz({ ...editableQuiz, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Limite de Tentativas</label>
              <input
                type="number"
                min={1}
                max={20}
                className="form-input"
                style={{ width: '120px' }}
                value={editableQuiz.maxAttempts}
                onChange={(e) => setEditableQuiz({ ...editableQuiz, maxAttempts: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Questões ({editableQuiz.questions?.length || 0})
            </h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleAddQuestion}
            >
              + Adicionar Questão
            </button>
          </div>

          {editableQuiz.questions?.map((q, qIdx) => (
            <div key={q.id} className="card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Questão {qIdx + 1}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleRemoveQuestion(qIdx)}
                >
                  Excluir Questão
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Enunciado da Questão</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={q.text}
                  onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label className="form-label">
                  Alternativas (Marque o rádio da alternativa correta):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        backgroundColor: opt.isCorrect ? 'var(--success-light)' : 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: opt.isCorrect ? '1px solid var(--success-border)' : '1px solid var(--border-color)'
                      }}
                    >
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={opt.isCorrect}
                        onChange={() => handleSetCorrectOption(qIdx, optIdx)}
                        title="Marcar como alternativa correta"
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, backgroundColor: 'var(--bg-surface)' }}
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                        required
                      />
                      {opt.isCorrect && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>
                          CORRETA
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleRemoveOption(qIdx, optIdx)}
                        title="Remover alternativa"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => handleAddOption(qIdx)}
                >
                  + Adicionar Alternativa
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', marginBottom: '3rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditorMode(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingEditor}>
              {savingEditor ? 'Salvando...' : 'Salvar Alterações do Quiz'}
            </button>
          </div>
        </form>
      ) : (
        /* MODO 2: VISUALIZAÇÃO E REALIZAÇÃO DO QUIZ */
        <div>
          {/* Formulário de Resposta para Aluno */}
          {canTakeQuiz ? (
            <form onSubmit={handleSubmitQuiz} className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                Responder Questões (Tentativa #{attempts.length + 1} de {quiz.maxAttempts})
              </h2>

              {quiz.questions?.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem'
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.75rem' }}>
                    {idx + 1}. {q.text}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options?.map((opt) => {
                      const isSelected = selectedAnswers[q.id] === opt.id;
                      return (
                        <label
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                            border: isSelected ? '1px solid var(--primary-border)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt.id}
                            checked={isSelected}
                            onChange={() => handleSelectAnswer(q.id, opt.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={submittingQuiz}
              >
                {submittingQuiz ? 'Calculando nota...' : 'Finalizar e Enviar Tentativa'}
              </button>
            </form>
          ) : isStudent && attemptsLeft <= 0 ? (
            <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
              Você já atingiu o limite de {quiz.maxAttempts} tentativas para este quiz. Sua melhor nota permanece salva no boletim.
            </div>
          ) : null}

          {/* HISTÓRICO DE TENTATIVAS DO ALUNO */}
          {isStudent && attempts.length > 0 && (
            <div className="card">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                Histórico de Suas Tentativas ({attempts.length})
              </h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tentativa</th>
                      <th>Data e Horário</th>
                      <th>Nota</th>
                      <th>Desempenho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((atm, i) => (
                      <tr key={atm.id}>
                        <td style={{ fontWeight: 600 }}>Tentativa #{attempts.length - i}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(atm.attemptedAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--success)' }}>
                            {atm.score} / 10,0
                          </strong>
                        </td>
                        <td>
                          <span className="user-role-tag role-student">
                            {atm.percentage}% acertos
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRÉ-VISUALIZAÇÃO DAS QUESTÕES PARA PROFESSOR / ADMIN */}
          {canEdit && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Questões Cadastradas ({quiz.questions?.length || 0})
                </h2>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditorMode(true)}
                >
                  ✏️ Editar Questões
                </button>
              </div>

              {quiz.questions?.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem'
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    {idx + 1}. {q.text}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '0.5rem' }}>
                    {q.options?.map((opt) => (
                      <div
                        key={opt.id}
                        style={{
                          fontSize: '0.9rem',
                          color: opt.isCorrect ? 'var(--success)' : 'var(--text-secondary)',
                          fontWeight: opt.isCorrect ? 600 : 400
                        }}
                      >
                        {opt.isCorrect ? '✓ ' : '○ '} {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
