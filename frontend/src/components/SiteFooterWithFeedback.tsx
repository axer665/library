"use client";

import { useEffect, useId, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { Modal } from "@/components/Modal";

function SiteFooterWithFeedbackInner() {
  const feedbackFormDomId = useId().replace(/:/g, "");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ email: "", name: "", message: "" });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const feedbackPrefilledForUserId = useRef<number | null>(null);

  useEffect(() => {
    if (!feedbackOpen) {
      feedbackPrefilledForUserId.current = null;
      return;
    }
    const u = authStore.user;
    if (!u) return;
    if (feedbackPrefilledForUserId.current === u.id) return;
    feedbackPrefilledForUserId.current = u.id;
    setFeedbackForm({ email: u.email, name: u.name, message: "" });
  }, [feedbackOpen, authStore.user]);

  const openFeedback = () => {
    setFeedbackError("");
    setFeedbackSuccess(false);
    setFeedbackOpen(true);
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackError("");
    setFeedbackSuccess(false);
    setFeedbackForm({ email: "", name: "", message: "" });
  };

  const onFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError("");
    const email = feedbackForm.email.trim();
    const name = feedbackForm.name.trim();
    const message = feedbackForm.message.trim();
    if (!email) {
      setFeedbackError("Укажите email — на него можно будет ответить.");
      return;
    }
    if (!name || !message) {
      setFeedbackError("Заполните имя и текст сообщения.");
      return;
    }
    setFeedbackLoading(true);
    try {
      await api.feedback.submit({ email, name, message });
      setFeedbackSuccess(true);
      setFeedbackForm({ email: "", name: "", message: "" });
    } catch (err: unknown) {
      setFeedbackError(err instanceof Error ? err.message : "Не удалось отправить сообщение");
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <>
      <footer className="shrink-0 border-t border-theme bg-parchment text-sm">
        <div className="mx-auto flex w-full max-w-6xl justify-center px-6 py-4">
          <button
            type="button"
            onClick={openFeedback}
            className="cursor-pointer text-accent transition hover:underline"
          >
            Обратная связь
          </button>
        </div>
      </footer>

      {feedbackOpen && (
        <Modal
          title="Форма обратной связи"
          onClose={closeFeedback}
          footer={
            feedbackSuccess ? (
              <button
                type="button"
                onClick={closeFeedback}
                className="w-full cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover"
              >
                Закрыть
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="submit"
                  form={feedbackFormDomId}
                  disabled={feedbackLoading}
                  className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover-bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {feedbackLoading ? "Отправка…" : "Отправить"}
                </button>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="cursor-pointer rounded-lg border border-theme px-4 py-2 text-sm font-medium text-ink transition hover:bg-sand"
                >
                  Отмена
                </button>
              </div>
            )
          }
        >
          {feedbackSuccess ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Спасибо, сообщение отправлено. Мы ответим на указанный email при необходимости.
              </p>
            </div>
          ) : (
            <form id={feedbackFormDomId} onSubmit={onFeedbackSubmit} className="space-y-4">
              <div className="rounded-lg border border-theme bg-parchment/80 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
                Заметили сбой или некорректную работу сайта? Напишите об этом через эту форму —
                администрация рассмотрит обращение и поможет устранить проблему.
              </div>
              {feedbackError && (
                <p className="rounded-lg bg-error px-3 py-2 text-sm text-error">{feedbackError}</p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Имя</label>
                <input
                  type="text"
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={feedbackForm.email}
                  onChange={(e) => setFeedbackForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  required
                  autoComplete="email"
                  inputMode="email"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Сообщение</label>
                <textarea
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full rounded-lg border border-theme px-3 py-2 text-ink"
                  rows={5}
                  required
                  maxLength={5000}
                />
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}

export const SiteFooterWithFeedback = observer(SiteFooterWithFeedbackInner);
