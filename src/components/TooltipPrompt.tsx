import HelpIcon from '@mui/icons-material/Help';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

export interface TooltipPromptProps {
  children: TooltipProps['title'];
}

export function TooltipPrompt({ children }: TooltipPromptProps) {
  return <LightTooltip title={children}>{<HelpIcon />}</LightTooltip>;
}

const LightTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.white,
      border: `1px solid ${theme.palette.divider}`,
      color: 'rgba(0, 0, 0, 0.87)',
      boxShadow: theme.shadows[7],
      fontSize: 14,
    },
  })
);
