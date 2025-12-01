import { useState, useCallback } from 'react';

export const useMessage = () => {
  const [message, setMessage] = useState('');

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }, []);

  return { message, showMessage };
};
