import React from 'react';
import { CheckIcon } from './Icons';
import './AutosaveBadge.css';

export function AutosaveBadge({ status, lastSavedTime }) {
  if (!status || status === 'idle') return null;

  return (
    <div className={`autosave-badge badge-${status}`}>
      {status === 'saving' && (
        <>
          <span className="save-pulse" />
          <span className="save-label">Saving draft...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <CheckIcon size={12} className="save-check" />
          <span className="save-label">
            Draft saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
          </span>
        </>
      )}

      {status === 'error' && (
        <span className="save-label save-error">Draft save failed</span>
      )}
    </div>
  );
}
