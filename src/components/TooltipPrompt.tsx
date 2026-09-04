import HelpIcon from '@mui/icons-material/Help';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

export interface TooltipPromptProps {
  children: TooltipProps['title'];
  maxWidth?: number;
}

export function TooltipPrompt({ children, maxWidth }: TooltipPromptProps) {
  return (
    <LightTooltip title={children} tooltipMaxWidth={maxWidth}>
      <span
        role="img"
        tabIndex={0}
        aria-label="More information"
        style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 0 }}
      >
        <HelpIcon aria-hidden="true" />
      </span>
    </LightTooltip>
  );
}

interface LightTooltipProps extends TooltipProps {
  tooltipMaxWidth?: number;
}

const LightTooltip = styled(({ className, tooltipMaxWidth, ...props }: LightTooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme, tooltipMaxWidth }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[7],
    fontSize: 14,
    ...(tooltipMaxWidth == null ? {} : { maxWidth: tooltipMaxWidth }),
  },
}));
