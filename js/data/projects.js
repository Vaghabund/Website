// ============================================
// Project Data
// ============================================
//
// MEDIA STRUCTURE:
// Projects are organized in: media/projects/[project-name]/
// Each project folder contains:
//   - images/        All images (hero, gallery, thumbnails)
//   - videos/        Video files (optional)
//   - models/        3D models (.glb files) (optional)
//   - documents/     PDFs and documents (optional)
//   - description.md Project metadata and content
//
// ADDING NEW PROJECTS:
// 1. Copy media/projects/_template/ to media/projects/your-project-name/
// 2. Add your media files to the appropriate folders
// 3. Run: node scripts/optimize-media-images.js
// 4. Edit description.md with project details
// 5. Add project entry below with updated paths
//
// IMAGE OPTIMIZATION:
// Original images go in images/ folder
// Optimization script auto-generates:
//   - .webp (full quality)
//   - -small.{jpg,webp} (800px)
//   - -thumb.{jpg,webp} (400px)
// ============================================

const projectsData = [
    {
        id: 1,
        title: 'Operational Analysis of Photogrammetry',
        subtitle: 'Master Thesis',
        year: '2025',
        description: 'A modern web application built with React and Node.js, featuring real-time collaboration and advanced data visualization.',
        fullDescription: 'Project Alpha represents a comprehensive solution for team collaboration in data-intensive environments. Built with modern web technologies, it provides real-time synchronization, advanced analytics, and intuitive user interfaces that make complex data accessible to all team members.',
        image: 'media/projects/OperationalAnalysisofPhotogrametry/images/Masterpräsi_01.png',
        thumbnailImage: 'media/projects/OperationalAnalysisofPhotogrametry/images/Masterpräsi_02.png',
        heroImage: 'media/projects/OperationalAnalysisofPhotogrametry/images/Masterpräsi_03.png',
        model3D: 'media/models/Harpy v24.gltf', // Path to 3D model
        model3DOptions: { // Optional 3D banner settings
            interactionType: 'cursor-follow',
            autoRotate: true,
            modelScale: 1.5,
            backgroundColor: 0x000000,
            maxRotation: 15,
            lerpFactor: 0.08
        },
        challenge: 'The main challenge was creating a system that could handle real-time data updates while maintaining performance and user experience across different devices and network conditions.',
        solution: 'We implemented a WebSocket-based architecture with optimistic updates and conflict resolution, paired with a responsive design system that adapts to various screen sizes and interaction methods.',
        role: 'Lead Developer & UI Designer',
        timeline: '4 months',
        technologies: ['TouchDesigner', 'Python', 'WebSocket', 'MongoDB'],
        liveUrl: 'https://example.com',
        gallery: [
            'media/projects/OperationalAnalysisofPhotogrametry/images/Masterpräsi_01.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/Masterpräsi_02.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/Masterpräsi_03.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/Masterpräsi_04.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/analysis.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/keypoints.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/matching.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/Pointcoud.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/ransacfilter.png',
            'media/projects/OperationalAnalysisofPhotogrametry/images/Tower_jpeg.jpg',
            'media/projects/OperationalAnalysisofPhotogrametry/images/Rundgang_01.png',
        ],
        thesis: 'media/projects/OperationalAnalysisofPhotogrametry/documents/MA DC_Joel Tenenberg_Operational Analysis of Photogrammetry.pdf',
        map: 'media/projects/OperationalAnalysisofPhotogrametry/documents/Map of Operational Analysis.pdf'
    },
    {
        id: 2,
        title: 'Project Beta',
        subtitle: 'UI/UX Design',
        year: '2024',
        description: 'Complete redesign of a mobile banking application, focusing on accessibility and user experience improvements.',
        fullDescription: 'A comprehensive redesign of a banking application that serves over 50,000 users daily. The project focused on improving accessibility, streamlining user flows, and creating a more intuitive financial management experience.',
        image: 'https://picsum.photos/400/250?random=2',
        thumbnailImage: 'https://picsum.photos/60/40?random=12',
        heroImage: 'https://picsum.photos/800/400?random=22',
        challenge: 'The existing app had poor accessibility scores and complex navigation that confused users, particularly older demographics.',
        solution: 'Implemented a new design system with clear visual hierarchy, improved color contrast, and simplified user flows based on extensive user testing.',
        role: 'UX Designer & Researcher',
        timeline: '6 months',
        technologies: ['Figma', 'React Native', 'Accessibility Testing', 'User Research'],
        gallery: [
            'https://picsum.photos/600/400?random=33',
            'https://picsum.photos/600/400?random=34'
        ]
    },
    {
        id: 3,
        title: 'Project Gamma',
        subtitle: 'Mobile App',
        year: '2023',
        description: 'Cross-platform mobile application for fitness tracking with AI-powered workout recommendations.',
        fullDescription: 'An innovative fitness application that uses machine learning to provide personalized workout recommendations based on user behavior, fitness level, and goals.',
        image: 'https://picsum.photos/400/250?random=3',
        thumbnailImage: 'https://picsum.photos/60/40?random=13',
        heroImage: 'https://picsum.photos/800/400?random=23',
        challenge: 'Creating an AI system that could provide accurate, personalized fitness recommendations while maintaining user privacy and data security.',
        solution: 'Developed a federated learning system that processes user data locally while contributing to model improvements without compromising personal information.',
        role: 'Mobile Developer & ML Engineer',
        timeline: '8 months',
        technologies: ['React Native', 'TensorFlow', 'Python', 'Firebase', 'HealthKit'],
        gallery: [
            'https://picsum.photos/600/400?random=35',
            'https://picsum.photos/600/400?random=36'
        ]
    },
    {
        id: 4,
        title: 'Project Delta',
        subtitle: 'Brand Identity',
        year: '2023',
        description: 'Complete brand identity design for a sustainable fashion startup, including logo, packaging, and digital presence.',
        fullDescription: 'A comprehensive brand identity project for EcoThreads, a sustainable fashion startup committed to ethical manufacturing and environmental responsibility.',
        image: 'https://picsum.photos/400/250?random=4',
        thumbnailImage: 'https://picsum.photos/60/40?random=14',
        heroImage: 'https://picsum.photos/800/400?random=24',
        challenge: 'Creating a brand identity that communicates both premium quality and environmental consciousness in a crowded fashion market.',
        solution: 'Developed a minimalist design language with earth-tones and sustainable materials, paired with clear messaging about the brand\'s environmental impact.',
        role: 'Brand Designer & Art Director',
        timeline: '3 months',
        technologies: ['Adobe Creative Suite', 'Figma', 'Print Design', 'Web Design'],
        gallery: [
            'https://picsum.photos/600/400?random=37',
            'https://picsum.photos/600/400?random=38'
        ]
    }
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = projectsData;
}
