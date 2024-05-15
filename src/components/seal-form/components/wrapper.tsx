interface WrapperProps {
  children: React.ReactNode;
  label: string;
}

const Wrapper: React.FC<WrapperProps>= ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;