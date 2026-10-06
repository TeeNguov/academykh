import SvgIcon from "@mdi/react";

type IconProps = {
  path: string;
  size?: number;
  className?: string;
};

export function Icon({ path, size = 1, className }: IconProps) {
  return <SvgIcon path={path} size={size} className={className} aria-hidden="true" />;
}
