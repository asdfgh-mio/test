document.addEventListener('DOMContentLoaded', () => {
    const vaultGrid = document.getElementById('vault-grid');
    const searchForm = document.getElementById('vault-search-form');
    const searchInput = document.getElementById('vault-search-input');
    const sectionTitle = document.getElementById('section-title');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');

    loadFeaturedLeaks();

    function showLoader(text) {
        loaderText.innerText = text;
        loader.style.display = 'flex';
        vaultGrid.style.display = 'none';
    }

    function hideLoader() {
        loader.style.display = 'none';
        vaultGrid.style.display = 'grid';
    }

    function loadFeaturedLeaks() {
        sectionTitle.innerText = "🎬 Featured Vault Items";
        vaultGrid.innerHTML = ''; 
        
        const leakVideos = [
            {
                title: "🎬 Featured Random Video 1",
                duration: "02:45",
                views: "340K+",
                thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
                targetUrl: "https://arslan-apis-v2.vercel.app/leakvideos",
                isDirect: true
            },
            {
                title: "🔥 Featured Random Video 2",
                duration: "03:15",
                views: "520K+",
                thumb: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=600&auto=format&fit=crop",
                targetUrl: "https://arslan-apis-v2.vercel.app/leakvideos2",
                isDirect: true
            }
        ];

        leakVideos.forEach((video) => {
            const card = createVideoCard(video);
            vaultGrid.appendChild(card);
        });
    }

    // REAL-TIME SEARCH (No fake timeouts)
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        showLoader(`🔍 Searching database for "${query}"...`);

        try {
            // Strictly fetch exactly what the API takes. NO setTimeout!
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.status && data.result && data.result.length > 0) {
                const singleItem = data.result[0]; 
                const targetUrl = singleItem.url || singleItem.link;
                
                if(targetUrl) {
                    sectionTitle.innerText = `✅ Result Found for "${query}"`;
                    vaultGrid.innerHTML = ''; 
                    
                    const mappedVideo = {
                        title: singleItem.title || singleItem.name || "Unknown Title",
                        duration: singleItem.duration || singleItem.time || "N/A",
                        views: singleItem.views || singleItem.view_count || "N/A",
                        thumb: singleItem.thumbnail || singleItem.thumb || singleItem.image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
                        targetUrl: targetUrl, 
                        isDirect: false
                    };
                    
                    const card = createVideoCard(mappedVideo);
                    vaultGrid.appendChild(card);
                } else {
                    alert("❌ Valid video link missing in result.");
                    loadFeaturedLeaks();
                }
            } else {
                alert("❌ No vault items matched your parameters.");
                loadFeaturedLeaks();
            }
        } catch (err) {
            console.error(err);
            alert("❌ Backend Search Server Error.");
            loadFeaturedLeaks();
        } finally {
            hideLoader();
        }
    });

    // CREATE REAL-TIME CARD
    function createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'vault-card';

        // Thumbnail pre-loaded visually
        card.innerHTML = `
            <div class="card-media-box">
                <img src="${video.thumb}" alt="Thumbnail" loading="lazy" onerror="this.src='https://via.placeholder.com/600x350/111111/ffffff?text=Thumbnail+Hidden'">
                <div class="play-overlay">
                    <div class="play-symbol">▶</div>
                </div>
            </div>
            <div class="card-info-box">
                <h3 title="${video.title}">${video.title}</h3>
                <div class="card-meta-row">
                    <span>⏱️ ${video.duration}</span>
                    <span>👁️ ${video.views}</span>
                </div>
            </div>
        `;

        const mediaBox = card.querySelector('.card-media-box');
        
        mediaBox.addEventListener('click', async () => {
            if (video.isDirect) {
                mediaBox.innerHTML = `<video src="${video.targetUrl}" controls autoplay playsinline></video>`;
            } else {
                // Keep the thumbnail visible as background, put a smooth loader over it
                mediaBox.innerHTML = `
                    <img src="${video.thumb}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="wa-loading-overlay">
                        <div class="spinner"></div>
                        <div class="wa-status-text">⏳ Fetching Video...</div>
                    </div>
                `;

                try {
                    // Fetch purely based on API speed. NO setTimeout artificial delays!
                    const res = await fetch(`/api/download?url=${encodeURIComponent(video.targetUrl)}`);
                    const data = await res.json();

                    let finalUrl = null;
                    if (data.status && data.result) {
                        if (typeof data.result === 'string') finalUrl = data.result;
                        else if (data.result.url) finalUrl = data.result.url;
                        else if (data.result.link) finalUrl = data.result.link;
                        else if (data.result.download) finalUrl = data.result.download;
                    }

                    if (finalUrl) {
                        // Immediately replace thumbnail with the fully loaded video
                        mediaBox.innerHTML = `<video src="${finalUrl}" controls autoplay playsinline crossorigin="anonymous"></video>`;
                    } else {
                        mediaBox.innerHTML = `
                            <img src="${video.thumb}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%);">
                            <div class="wa-loading-overlay"><span style="color:#ff4444; font-weight:bold; background:#111; padding: 5px 15px; border-radius: 20px;">❌ Video link expired</span></div>
                        `;
                    }
                } catch (err) {
                    mediaBox.innerHTML = `
                        <img src="${video.thumb}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%);">
                        <div class="wa-loading-overlay"><span style="color:#ff4444; font-weight:bold; background:#111; padding: 5px 15px; border-radius: 20px;">❌ Network Error</span></div>
                    `;
                }
            }
        });

        return card;
    }
});
