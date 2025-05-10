
import { useState } from "react";

export function useNamingInfo() {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const namingExplanation =
    "我們的事工名為「Chabod（כָּבוֹד）」，源自希伯來文，意指「榮耀」。這個名字回應了《撒母耳記上》中的約櫃流浪記——當神的約櫃被非利士人擄去時，以色列人驚呼「以迦博」（Ichabod），意思是「榮耀離開了以色列」。這是對神同在失落的極大哀嘆，但在耶穌基督裡，我們深信：神的榮耀從未離開(Chabod)，祂住在我們中間，正如昔日祂擊倒大袞一般，今天祂仍在這個數位化、AI快速擴張的世界中掌權。Chabod 是我們的宣告：無論世界如何改變，神的榮耀從未離席，依然運行、依然同在，並在每一個看似不可能的地方發出祂榮耀的光芒。";

  return {
    isTooltipOpen,
    setIsTooltipOpen,
    namingExplanation,
  };
}
