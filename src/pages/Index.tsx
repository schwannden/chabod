import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the dashboard page
    navigate("/");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Chabod - 教會管理系統</h1>
        <p className="text-xl text-gray-600">正在載入教會資訊...</p>
      </div>
    </div>
  );
};

export default Index;
