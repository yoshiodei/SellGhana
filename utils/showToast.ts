import { ToastTransitionProps, toast, Bounce } from 'react-toastify';

interface ItoastProperties {
    position: "top-center";
    autoClose: number;
    hideProgressBar: boolean;
    closeOnClick: boolean;
    pauseOnHover: boolean;
    draggable: boolean;
    theme: string;
    transition: ({ children, position, preventExitTransition, done, nodeRef, isIn, playToast }: ToastTransitionProps) => React.JSX.Element;
    toastId: string;
}    

export const showToast = (message: string, type: 'success' | 'error' | 'default') => {

  const toastProperties: ItoastProperties = {
    position: "top-center",
    autoClose: 2500,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
    transition: Bounce,
    toastId: 'custom-id-yes'
  }  

  if(type === 'success'){
    toast.success(message, toastProperties);
  }

  if(type === 'error'){
    toast.error(message, toastProperties);
  }
   
  else{
    toast(message, toastProperties);
  }   
}