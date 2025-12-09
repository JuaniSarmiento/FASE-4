import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Inicio',
  '/sessions': 'Sesiones',
  '/tutor': 'Tutor IA',
  '/simulators': 'Simuladores',
  '/risks': 'Análisis de Riesgos',
  '/evaluations': 'Evaluaciones',
  '/traceability': 'Trazabilidad',
  '/analytics': 'Git Analytics',
  '/test': 'Test Suite'
};

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Build breadcrumb items
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', path: '/' }
  ];

  let currentPath = '';
  pathnames.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Check if it's a dynamic segment (like session ID)
    const isDynamic = segment.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    
    if (isDynamic) {
      // For session detail, use a generic label
      breadcrumbs.push({
        label: `Sesión #${segment.slice(0, 8)}`,
        path: currentPath
      });
    } else {
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        label,
        path: currentPath
      });
    }
  });

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6 bg-white px-4 py-3 rounded-lg shadow">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={crumb.path} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400">/</span>
            )}
            {isLast ? (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
