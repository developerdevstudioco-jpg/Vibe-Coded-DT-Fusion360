import React from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';

const Toast = ({ children }) => {
  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      {children}
    </SnackbarProvider>
  );
};

export const useToast = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showToast = (message, variant = 'default') => {
    enqueueSnackbar(message, { variant });
  };

  return showToast;
};

export default Toast;