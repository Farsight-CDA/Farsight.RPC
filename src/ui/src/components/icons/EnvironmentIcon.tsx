export default function EnvironmentIcon(props: { class?: string }) {
  return (
    <svg
      class={props.class ?? "size-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7h18v5H3z" />
      <path d="M3 15h18v5H3z" />
      <path d="M7 7v13" />
      <path d="M17 7v13" />
    </svg>
  );
}
