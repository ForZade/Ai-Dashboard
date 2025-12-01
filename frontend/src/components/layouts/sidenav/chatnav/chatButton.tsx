import { IconProps } from "@solar-icons/react";
import { MenuDots } from "@solar-icons/react/ssr";
import { ComponentType, ReactNode } from "react";

interface ChatButtonProps {
    icon?: ComponentType<IconProps>;
    children?: ReactNode;
    className?: string;
    menu?: boolean;
}

export default function ChatButton({ icon: Icon, children, className, menu = true }: ChatButtonProps) {
    return (
        <button className={`flex w-full items-center p-1 gap-2 justify-between grow bg-linear-to-r hover:from-foreground/5 rounded-lg transition-colors group text-sm ${className}`}>
            <div className="flex items-center gap-2 overflow-hidden">
                { Icon && 
                    <div className="p-1.5">
                        <Icon size={20}/>
                    </div>
                }

                {
                    children && <p className="truncate">{ children }</p>
                }
            </div>

            {
                menu && 
                <div className="p-1 group-hover:text-foreground text-transparent hover:bg-foreground/5 rounded-lg">
                    <MenuDots weight="Bold" size={20}/>
                </div>
            }
        </button>
    )
}