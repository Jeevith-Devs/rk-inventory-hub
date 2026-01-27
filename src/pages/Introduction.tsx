import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function Introduction() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background cursor-pointer p-4"
      onClick={handleClick}
    >
      <img
        src={logo}
        alt="RK Inventory Hub"
        className="h-20 w-auto max-w-full sm:h-28 md:h-32 lg:h-40 xl:h-48 transition-transform hover:scale-105"
        style={{ maxWidth: 'min(90vw, 500px)' }}
      />
    </div>
  );
}
