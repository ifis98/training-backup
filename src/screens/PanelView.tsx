interface PanelViewProps {
  src: string;
}

export default function PanelView({ src }: PanelViewProps) {
  return (
    <iframe
      src={src}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="Panel"
    />
  );
}
