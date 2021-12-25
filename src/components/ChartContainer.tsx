import { Paper } from "@mui/material";

export interface ChartContainerProps {
    title: string;
    children: React.ReactChild;
}

export function ChartContainer({ children, title }: ChartContainerProps) {
    return <Paper variant="outlined" square component="section">
        <h3>{title}</h3>
        {children}
    </Paper>
} 