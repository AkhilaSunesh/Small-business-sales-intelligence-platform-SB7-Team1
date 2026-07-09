import PropTypes from 'prop-types';

export default function ErrorMessage({ title, messages }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="my-3 rounded-md border border-rose-600/20 bg-rose-900/5 p-3 text-sm text-rose-300">
      {title ? <div className="mb-1 font-semibold text-white">{title}</div> : null}
      <ul className="list-disc pl-4">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

ErrorMessage.propTypes = {
  title: PropTypes.string,
  messages: PropTypes.arrayOf(PropTypes.string),
};
