export default function LoadingSpinner(props: { class?: string }) {
  return (
    <span
      class={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90 ${props.class ?? ""}`}
      role="status"
      aria-label="Loading"
    />
  );
}
