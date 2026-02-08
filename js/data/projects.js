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
        slug: 'operational-analysis',
        detailPage: 'project-operational-analysis.html',
        cardRatio: '4/3',
        title: 'Operational Analysis of Photogrammetry',
        subtitle: 'Master Thesis',
        year: '2025',
        description: 'A modern web application built with React and Node.js, featuring real-time collaboration and advanced data visualization.',
        fullDescription: 'Project Alpha represents a comprehensive solution for team collaboration in data-intensive environments. Built with modern web technologies, it provides real-time synchronization, advanced analytics, and intuitive user interfaces that make complex data accessible to all team members.',
        image: 'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-01.png',
        thumbnailImage: 'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-02.png',
        heroImage: 'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-03.png',
        cardImage: 'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-01-small.jpg',
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
            'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-01.png',
            'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-02.png',
            'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-03.png',
            'media/projects/operational-analysis-of-photogrammetry/images/masterpraesi-04.png',
            'media/projects/operational-analysis-of-photogrammetry/images/analysis.png',
            'media/projects/operational-analysis-of-photogrammetry/images/keypoints.png',
            'media/projects/operational-analysis-of-photogrammetry/images/matching.png',
            'media/projects/operational-analysis-of-photogrammetry/images/pointcoud.png',
            'media/projects/operational-analysis-of-photogrammetry/images/ransacfilter.png',
            'media/projects/operational-analysis-of-photogrammetry/images/tower-jpeg.jpg',
            'media/projects/operational-analysis-of-photogrammetry/images/rundgang-01.png',
        ],
        thesis: 'media/projects/operational-analysis-of-photogrammetry/documents/ma-dc-joel-tenenberg-operational-analysis-of-photogrammetry.pdf',
        map: 'media/projects/operational-analysis-of-photogrammetry/documents/map-of-operational-analysis.pdf'
    },
    {
        id: 2,
        slug: 'vision-of-the-hybrid',
        detailPage: 'project-vision-of-the-hybrid.html',
        cardRatio: '4/3',
        title: 'Vision of the Hybrid',
        subtitle: 'Politics of Design',
        year: '2024',
        description: 'A posthuman exploration that uses a 3D-printed object and AI co-authorship to question identity and technology.',
        fullDescription: 'Drawing on relational thinking as collaborative engagement, the human condition is framed as contested and reversible. The project centers a 3D-printed object designed to provoke rather than instruct, paired with a non-linear narrative co-written with artificial intelligence. Through tactile exploration, it creates a space for questions about identity, technology, and otherness, inviting a collective reimagining of multiple futures.',
        image: 'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-02.png',
        thumbnailImage: 'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-02.png',
        heroImage: 'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-01.png',
        cardImage: 'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-02-small.jpg',
        role: '—',
        timeline: '6 months',
        technologies: ['Blender', 'Cinema4D', 'NomadSculpt', 'Aftereffects', 'whisper'],
        liveUrl: '',
        gallery: [
            'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-01.png',
            'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-02.png',
            'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-03.png',
            'media/projects/vision-of-the-hybrid/images/poster-vision-text-opt-04.png'
        ]
    }
];

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = projectsData;
}



