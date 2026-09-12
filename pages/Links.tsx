import React, { useState } from 'react';
import { DEFAULT_INITIAL_CARDS } from '../constants/presets';
import { NeeiPresentation } from '../components/qrcodes/NeeiPresentation';
import { Toast } from '../components/qrcodes/Toast';

const Links: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NeeiPresentation cards={DEFAULT_INITIAL_CARDS} onNotify={notify} />
      <Toast message={toastMessage} />
    </div>
  );
};

export default Links;
