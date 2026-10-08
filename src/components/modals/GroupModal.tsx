import React, { useState, useEffect, useRef } from "react";

export const GROUP_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Teal", value: "#06b6d4" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Slate", value: "#64748b" },
];

interface GroupModalProps {
  title: string;
  initialName?: string;
  initialColor?: string;
  onClose: (result: { name: string; color: string } | null) => void;
}

export function GroupModal({
  title,
  initialName = "",
  initialColor = "#3b82f6",
  onClose,
}: GroupModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleConfirm = () => {
    if (!name.trim()) return;
    onClose({ name: name.trim(), color: selectedColor });
  };

  const handleCancel = () => {
    onClose(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && name.trim()) {
      handleConfirm();
    }
  };

  return (
    <div style={styles.overlay} onClick={handleCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{title}</h2>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--text-secondary, #a0a0b0)",
              marginBottom: "6px",
              fontWeight: 500,
            }}
          >
            Group Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
            placeholder="e.g. Research, Writing"
            autoFocus
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--text-secondary, #a0a0b0)",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Group Color
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {GROUP_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedColor(c.value)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: c.value,
                  border: selectedColor === c.value ? "2px solid var(--text-primary, #ffffff)" : "2px solid transparent",
                  boxShadow: selectedColor === c.value ? "0 0 0 2px var(--bg-secondary)" : "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "transform 0.1s",
                  transform: selectedColor === c.value ? "scale(1.1)" : "scale(1)",
                }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={handleCancel} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            style={{
              ...styles.confirmBtn,
              opacity: name.trim() ? 1 : 0.5,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "var(--bg-secondary, #1e1e2e)",
    borderRadius: "8px",
    padding: "24px",
    width: "320px",
    boxShadow: "none",
    border: "1px solid var(--border, #3e3e50)",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    color: "var(--text-primary, #ffffff)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "4px",
    border: "1px solid var(--border-medium, #3e3e50)",
    backgroundColor: "var(--bg-tertiary, #14141f)",
    color: "var(--text-primary, #ffffff)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
  },
  cancelBtn: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "var(--bg-secondary, #1e1e2e)",
    color: "var(--text-secondary, #a0a0b0)",
    cursor: "pointer",
    fontSize: "14px",
  },
  confirmBtn: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "var(--accent, #6c63ff)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
  },
};
