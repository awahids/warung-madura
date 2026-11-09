export default function Loading({ error }) {
  return (
    <div className="overlay" role="status">
      {error ? (
        <>
          <h1>Waduh, gagal memuat</h1>
          <p>{error.message}</p>
          <button onClick={() => location.reload()}>Coba lagi</button>
        </>
      ) : (
        <>
          <h1>Juragan Warung</h1>
          <div className="spinner" />
          <p>Membuka rolling door…</p>
        </>
      )}
    </div>
  );
}
