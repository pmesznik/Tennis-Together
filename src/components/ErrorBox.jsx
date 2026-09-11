export default function ErrorBox({ children }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 13,
        color: "var(--color-secondary)",
        background: "color-mix(in srgb, var(--color-secondary) 12%, transparent)",
        borderRadius: 10,
        padding: "8px 12px",
      }}
    >
      {children}
    </p>
  );
}
