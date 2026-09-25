import ConnectionQR from '../components/ConnectionQR'

export default function JoinQR({ url }) {
  return (
    <div
      style={{
        borderRadius: 8,
        marginBottom: 16,
        maxWidth: "100%",
        overflow: 'hidden',
        width: 192,
        height: 192,
      }}
    >
      <ConnectionQR url={url} label="Scan to connect with this store" size={192} />
    </div>
  );
}
