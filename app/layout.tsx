import './globals.css';
import type {Metadata} from 'next';
import Providers from './providers';
export const metadata:Metadata={title:'31G Operations Management System',description:'31G digital marketing agency operations, projects, clients, team workload and performance'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Providers>{children}</Providers></body></html>}
