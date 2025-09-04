// app.js

// --- 1. DOMContentLoaded Event Listener ---
// Ensures the DOM is fully loaded before running scripts that interact with it.
document.addEventListener('DOMContentLoaded', async () => {
    console.log("App script loaded and DOM ready.");

    // --- 2. Offline Banner ---
    const offlineBanner = document.getElementById('offline-banner');
    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineBanner?.classList.add('hidden');
        } else {
            offlineBanner?.classList.remove('hidden');
        }
    }
    updateOnlineStatus(); // Check initial status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // --- 3. Add to Home Screen (A2HS) Prompt ---
    let deferredPrompt;
    const installBanner = document.getElementById('install-banner');
    const installButton = document.getElementById('install-button');
    const dismissInstallButton = document.getElementById('dismiss-install');

    window.addEventListener('beforeinstallprompt', (event) => {
        console.log("A2HS event captured.");
        event.preventDefault(); // Prevent the default mini-infobar
        deferredPrompt = event;  // Stash the event
        installBanner?.classList.remove('hidden'); // Show custom banner
    });

    installButton?.addEventListener('click', async () => {
        if (deferredPrompt) {
            installBanner?.classList.add('hidden');
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`A2HS prompt outcome: ${outcome}`);
            deferredPrompt = null; // Clear the saved prompt
        }
    });

    dismissInstallButton?.addEventListener('click', () => {
        installBanner?.classList.add('hidden');
        // Optional: Use localStorage to prevent showing again for a while
        // localStorage.setItem('a2hsPromptDismissed', Date.now().toString());
    });

    // --- 4. Dark Mode Toggle ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    const savedMode = localStorage.getItem('darkMode');
    const useDarkMode = savedMode ? savedMode === 'enabled' : prefersDarkScheme.matches;

    if (useDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggle.textContent = '🌙';
    }

    darkModeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    });

    // Optional: Listen for system preference changes (if no user pref is saved)
    // prefersDarkScheme.addEventListener('change', (e) => {
    //     if (!localStorage.getItem('darkMode')) {
    //         if (e.matches) {
    //             document.body.classList.add('dark-mode');
    //             darkModeToggle.textContent = '☀️';
    //         } else {
    //             document.body.classList.remove('dark-mode');
    //             darkModeToggle.textContent = '🌙';
    //         }
    //     }
    // });

    // --- 5. Web Share API ---
    const shareButton = document.getElementById('share-button');
    if (navigator.share && navigator.onLine) {
        shareButton?.addEventListener('click', async () => {
            try {
                await navigator.share({
                    title: 'College Timetable - CSE',
                    text: 'Check out my college timetable!',
                    url: window.location.href
                });
                console.log('Content shared successfully');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        });
    } else {
        shareButton?.style.display = 'none';
        console.log('Web Share API not supported or user is offline');
    }

    // --- 6. Timetable Loading & Display ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const timetableContent = document.getElementById('timetable-content');
    const tableBody = document.querySelector('#timetable-content tbody');

    // Show loading indicator
    loadingIndicator?.classList.remove('hidden');
    timetableContent?.classList.add('hidden');

    try {
        // --- Simulate or Load Timetable Data ---
        // Option 1: Hardcoded data (for simplicity, replace with fetch if using a data file)
        console.log("Loading timetable data...");
        // Simulate a network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Example hardcoded data - Replace this block with fetch('./data/timetable.json') if using a file
        const timetableData = [
            { time: "9:00 AM", monday: "Math", tuesday: "Physics", wednesday: "Chemistry", thursday: "Biology", friday: "English" },
            { time: "10:00 AM", monday: "Physics", tuesday: "Math", wednesday: "English", thursday: "Chemistry", friday: "Lab" },
            { time: "11:00 AM", monday: "Chemistry", tuesday: "Biology", wednesday: "Math", thursday: "Physics", friday: "Free" },
            { time: "12:00 PM", monday: "Lunch", tuesday: "Lunch", wednesday: "Lunch", thursday: "Lunch", friday: "Lunch" },
            { time: "1:00 PM", monday: "English", tuesday: "Chemistry", wednesday: "Physics", thursday: "Math", friday: "Project" },
            // Add more rows as needed
        ];

        // Option 2: Fetch from a data file (uncomment and comment Option 1 above)
        /*
        const response = await fetch('./data/timetable.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const timetableData = await response.json();
        */

        // --- Populate the Timetable ---
        if (tableBody) {
            tableBody.innerHTML = ''; // Clear any existing rows
            timetableData.forEach(rowData => {
                const row = document.createElement('tr');
                // Create time cell (could be a header)
                const timeCell = document.createElement('th');
                timeCell.scope = "row";
                timeCell.textContent = rowData.time;
                row.appendChild(timeCell);

                // Create cells for each day
                ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                    const cell = document.createElement('td');
                    cell.textContent = rowData[day] || '-'; // Handle missing data
                    row.appendChild(cell);
                });

                tableBody.appendChild(row);
            });
        }

        // Hide loading, show content
        loadingIndicator?.classList.add('hidden');
        timetableContent?.classList.remove('hidden');
        console.log("Timetable loaded and displayed.");

    } catch (error) {
        console.error("Error loading or displaying timetable:", error);
        // Update UI to show error
        if (loadingIndicator) {
            loadingIndicator.innerHTML = "<p>Error loading timetable. Please check your connection and try again.</p>";
        }
        // Optionally, still show the table structure even if data failed?
        // timetableContent?.classList.remove('hidden');
    }

    // --- 7. Service Worker Registration (Alternative Location) ---
    // This is already done in index.html, but can also be done here.
    // if ('serviceWorker' in navigator) {
    //   window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js')
    //       .then(reg => console.log('✅ SW registered:', reg.scope))
    //       .catch(err => console.log('❌ SW registration failed:', err));
    //   });
    // }
});