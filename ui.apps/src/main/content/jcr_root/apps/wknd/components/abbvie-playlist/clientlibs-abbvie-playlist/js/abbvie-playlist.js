document.addEventListener('DOMContentLoaded', function () {
    // ================================
    // INITIAL SETUP AND STATE
    // ================================
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content-div');
    const categorySection = document.getElementById('categorySection');
    const mediaContainer = document.getElementById('content1');
    const categoryItems = document.querySelectorAll('.category-item');
    const mobileCategoryDropdown = document.getElementById('mobileCategoryDropdown');
    const mobileSelect = document.getElementById('mobileCategorySelect');
    const playlistContainer = document.getElementById('content2');
    const staticApiResponse = {
        media: {
            categories: {}
        }
    };
    const servletParentPath = '/sling/servlet/default'
    let currentButton = null;
    let currentApi = null;
    let oldName;
    let mainResponse;
    const checkboxContainer = document.getElementById('checkboxContainer');
    const saveBtn = document.getElementById('saveCheckboxes');
    const cancelBtn = document.getElementById('cancelDialog');
    const newPlaylistDialog = document.getElementById('newPlaylistDialog');
    const saveNewPlaylistBtn = document.getElementById('saveNewPlaylist');
    const cancelNewPlaylistBtn = document.getElementById('cancelNewPlaylist');
    const newPlaylistInput = document.getElementById('newPlaylistName');
    const createPlaylist = document.querySelector('.create-playlist');
    const createPlus = document.querySelector('.create-plus');
    const dialogTitle = document.getElementById('dialogTitle');

    const cancelRenamePlaylist = document.getElementById('renamePlaylistCancel');
    const saveRenamePlaylist = document.getElementById('saveRenamePlaylist');
    const renamePlaylistDialog = document.getElementById('RenameDialog');
    const renamePlaylistInput = document.getElementById('renamePlaylistName');
    const noPlaylists = document.getElementById('no-playlists-message');

    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    const changePlaylistCancel = document.getElementById('changePlaylistCancel');
    const saveChangePlaylist = document.getElementById('saveChangePlaylist');
    let playListName;
    let changeOrderVideoOrgList;
    let videoList;
    //=====snack bar-code-start======================================
    let snackBarTimeout;
    let closeListenerAttached = false;

    function snackBarMessage(message, type = 'success') {
        const snackBar = document.getElementById("snackBar");
        const messageSpan = snackBar.querySelector(".snack-message");
        const closeBtn = snackBar.querySelector(".snack-close");

        messageSpan.textContent = message;

        snackBar.classList.remove("success", "error");
        snackBar.classList.add(type === 'error' ? 'error' : 'success');

        snackBar.classList.add("show");
        snackBar.style.display = "block";
        clearTimeout(snackBarTimeout);
        snackBarTimeout = setTimeout(() => {
            closeSnackBar();
        }, 3000);
        if (!closeListenerAttached && closeBtn) {
            closeBtn.addEventListener("click", () => {
                closeSnackBar();
            });
            closeListenerAttached = true;
        }
    }

    function closeSnackBar() {
        const snackBar = document.getElementById("snackBar");
        snackBar.classList.remove("show");
        setTimeout(() => {
            snackBar.style.display = "none";
        }, 400);
    }

    //======snack bar-code-end========================================

    // ================================
    // HELPER FUNCTIONS
    // ================================
    function extractYouTubeId(url) {
        const regExp = /^.*(youtu\.be\/|v\/|watch\?v=|embed\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    }

    function resetTabs() {
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
    }

    function resetPlusIcon() {
        if (currentButton) {
            currentButton.textContent = '+';
            currentButton = null;
        }
    }

    function openNewPlaylistDialog() {
        document.getElementById('videoDialog').style.display = 'none';
        newPlaylistInput.value = '';
        newPlaylistDialog.style.display = 'flex';
    }

    function renderCheckboxes(options) {
        checkboxContainer.innerHTML = '';
        console.log("this is options", options)
        options.forEach(option => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option;
            label.append(' ' + option);
            label.appendChild(checkbox);
            checkboxContainer.appendChild(label);
        });
    }

    // ================================
    // DATA CONSTRUCTION
    // ================================
    const playlistDivs = document.querySelectorAll('#playlist-data .playlist');
    playlistDivs.forEach((playlistDiv, pIndex) => {
        const categoryName = playlistDiv.dataset.category;
        const category = {
            category: categoryName,
            questions: {}
        };

        const questionDivs = playlistDiv.querySelectorAll('.question');
        questionDivs.forEach((questionDiv, qIndex) => {
            const questionText = questionDiv.dataset.question;
            const videoList = [];

            const videoDivs = questionDiv.querySelectorAll('.video');
            videoDivs.forEach(videoDiv => {
                const videoUrl = videoDiv.dataset.video;
                const videoId = extractYouTubeId(videoUrl);

                videoList.push({
                    videoTitle: videoId || 'Untitled',
                    videoDescription: 'No description provided',
                    videoUrl: videoId ?
                        `https://www.youtube.com/embed/${videoId}` : videoUrl,
                    videoThumbnail: videoId ?
                        `https://img.youtube.com/vi/${videoId}/0.jpg` : '',
                });
            });

            category.questions[qIndex] = {
                question: questionText,
                videoList: videoList,
            };
        });

        staticApiResponse.media.categories[pIndex] = category;
    });

    // ================================
    // UI RENDERING
    // ================================
    function renderCategoryContent(categoryIndex) {
        const category = staticApiResponse.media.categories[categoryIndex];
        if (!category) return;

        mediaContainer.innerHTML = '';

        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category.category;
        Object.assign(categoryTitle.style, {
            color: '#003366',
            marginTop: '0px',
            fontSize: 'x-large',
        });
        mediaContainer.appendChild(categoryTitle);

        Object.values(category.questions).forEach((question, qIndex) => {
            const accordionItem = document.createElement('div');
            accordionItem.classList.add('accordion-item');

            const questionHeader = document.createElement('div');
            questionHeader.classList.add('accordion-header');
            questionHeader.innerHTML = `
        <span>${question.question}</span>
        <span class="icon">⋁</span>
      `;
            const iconSpan = questionHeader.querySelector('.icon');

            const questionBody = document.createElement('div');
            questionBody.classList.add('accordion-body');

            questionHeader.addEventListener('click', () => {
                const isOpen = questionBody.classList.contains('active');

                document.querySelectorAll('.accordion-body').forEach(body => body.classList.remove('active'));
                document.querySelectorAll('.accordion-header').forEach(header => {
                    header.classList.remove('active');
                    header.querySelector('.icon')?.classList.remove('rotate');
                });

                if (!isOpen) {
                    questionBody.classList.add('active');
                    questionHeader.classList.add('active');
                    iconSpan.classList.add('rotate');
                }
            });

            question.videoList.forEach((video, vIndex) => {
                const videoCard = document.createElement('div');
                videoCard.classList.add('media-item');
                videoCard.innerHTML = `
          <div class="indexing">${vIndex + 1}</div>
          <div class="media-thumbnail">
            <iframe src="${video.videoUrl}" frameborder="0" allowfullscreen></iframe>
          </div>
          <div class="media-info">
            <div class="media-title">${video.videoTitle}</div>
            <div class="media-author">${video.videoDescription}</div>
          </div>
          <div class="plus-icon">
            <div class="test-icon">
              <button class="open-dialog" data-title="${video.videoTitle}" data-description="${video.videoDescription}" data-url="${video.videoUrl}">+</button>
            </div>
          </div>
        `;
                questionBody.appendChild(videoCard);
            });

            accordionItem.appendChild(questionHeader);
            accordionItem.appendChild(questionBody);
            mediaContainer.appendChild(accordionItem);
        });
    }

    // ================================
    // EVENT LISTENERS
    // ================================
    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            categoryItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            renderCategoryContent(this.dataset.categoryIndex);
        });
    });

    tabs.forEach(tab => {

        tab.addEventListener("click", function () {

            resetTabs();

            tab.classList.add("active");

            const targetId = tab.dataset.tab;

            const targetContent = document.getElementById(targetId);

            if (targetContent) targetContent.classList.add("active");

            if (targetId === "content1") {
                categorySection.style.display = "block";
                playlistContainer.style.display = 'none';
                if (window.innerWidth <= 767 && mobileCategoryDropdown) {
                    mobileCategoryDropdown.style.display = "block";
                }

                const activeIndex = document.querySelector(".category-item.active")?.dataset.categoryIndex || 0;

                renderCategoryContent(activeIndex);

            } else {
                categorySection.style.display = "none";
                playlistContainer.style.display = 'grid';
                mobileCategoryDropdown.style.display = "none";
                renderPlaylist();
            }

        });

    });

    if (categoryItems.length > 0) {
        categoryItems[0].classList.add('active');
        categoryItems[0].click();
    }

    if (mobileSelect) {
        mobileSelect.addEventListener('change', function () {
            const selectedIndex = this.value;
            const desktopCategory = document.querySelector(`.category-item[data-category-index="${selectedIndex}"]`);
            if (desktopCategory) desktopCategory.click();
        });
    }

    // Dialog interactions
    document.body.addEventListener('click', async function (e) {
        if (e.target.classList.contains('open-dialog')) {
            currentButton = e.target;
            currentButton.textContent = '−';
            currentApi = e.target.dataset.url;

            const options = await getPlaylistsApi();
            renderCheckboxes(options);

            document.getElementById('videoDialog').style.display = 'flex';
        }

        if (e.target.classList.contains('close-dialog')) {
            document.getElementById('videoDialog').style.display = 'none';
            resetPlusIcon();
        }
    });

    cancelBtn.addEventListener('click', () => {
        document.getElementById('videoDialog').style.display = 'none';
        resetPlusIcon();
    });

    saveBtn.addEventListener('click', () => {
        if (!currentApi) return;

        const selected = [
            ...checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'),
        ].map(cb => cb.value);

        const payload = {
            videoUrl: currentApi,
            playlistNames: selected,
        };

        addVideoToPlaylists(payload);
        currentApi = null;

        document.getElementById('videoDialog').style.display = 'none';
        resetPlusIcon();
    });

    createPlaylist.addEventListener('click', openNewPlaylistDialog);
    createPlus.addEventListener('click', openNewPlaylistDialog);

    saveNewPlaylistBtn.addEventListener('click', () => {
        const playlistName = newPlaylistInput.value.trim();
        if (!playlistName) return alert('Please enter a playlist name.');
        createPlaylistApi({
            playlistName,
            videoId: currentApi
        });
        newPlaylistDialog.style.display = 'none';
        document.getElementById('videoDialog').style.display = 'none';
        resetPlusIcon();
    });

    cancelNewPlaylistBtn.addEventListener('click', () => {
        newPlaylistDialog.style.display = 'none';
        document.getElementById('videoDialog').style.display = 'flex';
        resetPlusIcon();
    });

    //=============rename-dialog-logic-start=============

    saveRenamePlaylist.addEventListener('click', async () => {
        const renamePlaylistName = renamePlaylistInput.value.trim();
        console.log("renamePlaylistName", renamePlaylistName, oldName);
        if (!renamePlaylistName) return alert('Please enter a playlist name.');
        await renamePlaylist(renamePlaylistName, oldName);
        oldName = null;
        renamePlaylistDialog.style.display = 'none';
        renamePlaylistInput.dataset.oldName = '';
        renamePlaylistInput.value = '';
        await renderPlaylist();

    });

    cancelRenamePlaylist.addEventListener('click', () => {
        renamePlaylistDialog.style.display = 'none';
    });

    // ================================
    // API FUNCTIONS
    // ================================

    function renamePlaylist(renametest1, oldRename) {
        const renamePlaylistName = {
            previousPlaylistName: oldRename,
            playlistName: renametest1
        };

        return fetch('/libs/granite/csrf/token.json')
            .then(res => res.json())
            .then(csrf => {
                return fetch(servletParentPath + '.rename-playlist.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrf.token,
                        Authorization: 'Basic ' + btoa('admin:admin'),
                    },
                    body: JSON.stringify(renamePlaylistName),
                });
            })
            .then(async response => {
                const data = await response.json();

                if (data.status === 'success') {
                    console.log("data", data.message, data.status);
                    snackBarMessage(data.message, data.status)
                } else {
                    snackBarMessage(data.message, "error");
                }
            })
            .catch(err => {
                const error = JSON.parse(err)
                console.log(err)
                snackBarMessage(error.message, "error");
            });
    }

    function getPlaylistsApi() {
        return fetch('/libs/granite/csrf/token.json')
            .then(res => res.json())
            .then(csrf => {
                return fetch('/bin/publish-playlist-names.json', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrf.token,
                        Authorization: 'Basic ' + btoa('admin:admin'),
                    },
                });
            })
            .then(async data => {

                const response = await data.json();
                console.log("response", response)
                if (response.status === "success") {
                    return response.playlistNames || [];
                } else {
                    snackBarMessage(response.message, "error");
                }

            })
            .catch(err => {
                console.log(err)
                const error = JSON.parse(err)
                snackBarMessage(error.message, "error");
                return [];
            });
    }

    function addVideoToPlaylists(payload) {
        fetch('/libs/granite/csrf/token.json')
            .then(res => res.json())
            .then(csrf => {
                fetch('/bin/send-data-to-author.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrf.token,
                        Authorization: 'Basic ' + btoa('admin:admin'),
                    },
                    body: JSON.stringify(payload),
                })
                    .then(response => {
                        if (!response.ok) {
                            return response.text().then(err => Promise.reject(err));
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.status === 'success') {
                            snackBarMessage(data.message, data.status);
                        } else {
                            snackBarMessage(data.message, "error");
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        const error = JSON.parse(err)
                        snackBarMessage(error.message, "error");
                    });
            });
    }

    function createPlaylistApi(payload) {
        fetch('/libs/granite/csrf/token.json')
            .then(res => res.json())
            .then(csrf => {
                fetch('/bin/publish-create-playlist.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrf.token,
                        Authorization: 'Basic ' + btoa('admin:admin'),
                    },
                    body: JSON.stringify(payload),
                })
                    .then(async response => {
                        const data = await response.json();

                        if (data.status === 'success') {
                            snackBarMessage(data.message, data.status);
                        } else {
                            snackBarMessage(data.message, "error");
                        }
                    })
                    .catch(err => {
                        const error = JSON.parse(err)
                        console.log(err)
                        snackBarMessage(error.message, "error");
                    });
            });
    }

    async function getPlaylistsDataApi() {
        const csrfRes = await fetch('/libs/granite/csrf/token.json');
        const csrf = await csrfRes.json();

        const playlistDataResponse = await fetch('/bin/publish-playlists-data.json', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrf.token,
                Authorization: 'Basic ' + btoa('admin:admin'),
            },
        });
        mainResponse = await playlistDataResponse.json();
        if (mainResponse.status === "success") {
            return mainResponse.playlistData || [];
        }
        return mainResponse || [];
    }

    async function changeOrderApi(payload) {

    }

    function deletePlaylist(payload) {
        fetch('/libs/granite/csrf/token.json')
            .then(res => res.json())
            .then(csrf => {
                fetch('/bin/publish-delete-playlist.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrf.token,
                        Authorization: 'Basic ' + btoa('admin:admin'),
                    },
                    body: JSON.stringify(payload),
                })
                    .then(async response => {
                        const data = await response.json();

                        if (data.status === 'success') {
                            showPopup(data.message || 'Playlist deletion was successful');
                        } else {
                            showErrorPopup(data.message || 'Playlist deletion was unsuccessful');
                        }
                        return data;
                    })
                    .catch(err => {
                        console.log(err)
                        showErrorPopup(err.message || 'Failed to delete playlist.');
                    });
            });
    }

    function deleteVideo(url, title) {
        console.log("payload for delete video", {
            videoUrl: url,
            playlistName: title
        });
        fetch('/libs/granite/csrf/token.json')
            .then(res => res.json())
            .then(csrf => {
                fetch('/bin/publish-delete-video.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrf.token,
                        Authorization: 'Basic ' + btoa('admin:admin'),
                    },
                    body: JSON.stringify({
                        videoUrl: url,
                        playlistName: title
                    }),
                })
                    .then(async response => {
                        const data = await response.json();

                        if (data.status === 'success') {
                            showPopup(data.message || 'Video deletion was successful');
                        } else {
                            showErrorPopup(data.message || 'Video deletion was unsuccessful');
                        }
                        return data;
                    })
                    .catch(err => {
                        console.log(err)
                        showErrorPopup(err.message || 'Failed to delete video.');
                    });
            });
    }

    //==========api callS ends here=================================

    //=====render playlist tab-cards-----start---- =================
    async function renderPlaylist() {

        const playlistData = await getPlaylistsDataApi();
        if (playlistData.status === "failed") {
            playlistContainer.innerHTML = `${playlistData.message}`;
            return "";
        }
        playlistContainer.innerHTML = '';
        playlistData.forEach(playlistObject => {
            const [name] = Object.keys(playlistObject);
            const videoUrls = playlistObject[name];
            const playlistDiv = document.createElement('div');
            playlistDiv.className = 'playlist-item';
            const a = document.createElement('a');
            a.href = '#';
            const img = document.createElement('img');
            img.src = playlistObject.thumbnailUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMS0W4MCaiGuG6gl3NnQ3dq3jTB0coMwNI8g&s';
            img.alt = `${name} thumbnail`;
            a.appendChild(img);
            a.addEventListener('click', async (event) => {
                event.preventDefault();
                playListName = name;
                // ====below function for rendering the playList video renderings==start==========
                await playListVideos(name)
                // ====below function for rendering the playList video renderings==end============
            });

            // Create the parent div to contain both elements
            const playlistItemsContainer = document.createElement('div');
            playlistItemsContainer.className = 'playlist-item-container';

            // Playlist Info (Name and Item Count)
            const info = document.createElement('div');
            info.className = 'playlist-info';
            if (oldName) {
                info.innerHTML = `${oldName} <br> ${videoUrls.length} items`;
            } else {
                info.innerHTML = `${name} <br> ${videoUrls.length} items`;
            }

            // Options (Rename, Delete)
            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'options-wrapper';

            const ellipsis = document.createElement('div');
            ellipsis.className = 'ellipsis';
            ellipsis.textContent = '⋮';

            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown hidden';

            const renameOption = document.createElement('div');
            renameOption.textContent = 'Rename';
            const deleteOption = document.createElement('div');
            deleteOption.textContent = 'Delete';

            // Event listeners for rename and delete
            renameOption.addEventListener('click', () => {
                oldName = name;
                renamePlaylistDialog.style.display = "flex";
                renamePlaylistInput.value = name;
                renamePlaylistInput.dataset.oldName = name;
                dropdown.classList.add('hidden');
            });

            //=========delete===start==================================
            deleteOption.addEventListener('click', () => {
                dropdown.classList.add('hidden');
                const modal = document.getElementById('delete-modal');
                const message = document.getElementById('delete-message');
                const confirmBtn = document.getElementById('confirm-delete');
                const cancelBtn = document.getElementById('cancel-delete');
                modal.classList.remove('hidden');
                const newConfirm = confirmBtn.cloneNode(true);
                const newCancel = cancelBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
                cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
                newConfirm.addEventListener('click', () => {
                    deletePlaylist({
                        playlistName: name
                    });
                    modal.classList.add('hidden');
                    setTimeout(() => {
                        renderPlaylist();
                    }, 500);
                });
                newCancel.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            });
            // =========delete== end ========

            dropdown.appendChild(renameOption);
            dropdown.appendChild(deleteOption);
            optionsWrapper.appendChild(ellipsis);
            optionsWrapper.appendChild(dropdown);

            // Toggle dropdown on ellipsis click
            ellipsis.addEventListener('click', (e) => {
                dropdown.classList.toggle('hidden');
                e.stopPropagation();
            });

            // Close dropdown if clicked outside
            document.addEventListener('click', () => {
                dropdown.classList.add('hidden');
            });

            playlistItemsContainer.appendChild(info);
            playlistItemsContainer.appendChild(optionsWrapper);

            // Append the elements to the card
            playlistDiv.appendChild(a);
            playlistDiv.appendChild(playlistItemsContainer);

            // Append the card to the container
            playlistContainer.appendChild(playlistDiv);
        });
    }

    //=====playlist-video-render-function==start=================
    function playListVideos(name) {
        console.log("playlistData", mainResponse);
        const filteredData = getPlaylistByName(mainResponse, name)
        console.log("filteredData", filteredData);
        const mainDialog = document.querySelector(".centered-container");
        mainDialog.style.display = "none";
        const main = document.querySelector(".main-playlist-container");
        main.style.display = "flex";
        const breadcrumb = document.querySelector("#dynamicBreadcrumb");
        if (breadcrumb) {
            breadcrumb.style.display = "flex";
            const current = document.getElementById("breadcrumb-current");
            if (current) current.textContent = name;

            // Add click handler to Home breadcrumb
            const homeBreadcrumb = document.getElementById("breadcrumb-home");
            if (homeBreadcrumb) {
                homeBreadcrumb.style.cursor = "pointer";

                // Avoid duplicate listeners
                homeBreadcrumb.removeEventListener("click", goBackToMain);
                homeBreadcrumb.addEventListener("click", goBackToMain);
            }
        }
        changeOrderVideoOrgList = filteredData
        const sidebar = document.querySelector(".playlist-items");
        leftSidebar(sidebar, filteredData);
    }

    function updateVideoCount() {
        const videoCountElement = document.querySelector('.video-count');
        console.log(videoCountElement);
        const totalCountTag = document.querySelector('.total-count');
        console.log(totalCountTag);
        totalCountTag.textContent = `${totalVideos} items | 6:31:23`;
        videoCountElement.textContent = `${currentVideoIndex + 1}/${totalVideos}`;
    }

    function autoPlayVideo() {
        const checkbox = document.getElementById("autoplay-switch");
        return checkbox && checkbox.checked;
    }

    function leftSidebar(sidebar, filteredData) {
        sidebar.innerHTML = '';

        let firstVideoUrl = null;
        let firstVideoTitle = null;
        let videoLoaded = false;

        filteredData.forEach((item, index) => {
            const key = Object.keys(item)[0];
            const videoUrls = item[key]; // array of URLs
            const title = key;
            videoUrls1 = item[key];
            totalVideos = videoUrls.length;

            videoUrls.forEach((url, idx) => {
                const videoId = getYouTubeID(url);
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/default.jpg`;

                const rowDiv = document.createElement('div');
                rowDiv.className = 'playlist-row';

                const rowNumber = document.createElement('span');
                rowNumber.className = 'row-number';
                rowNumber.textContent = `${idx + 1}`;

                const img = document.createElement('img');
                img.src = thumbnailUrl;
                img.alt = 'Video Thumbnail';
                img.className = 'video-thumbnail';

                const titleSpan = document.createElement('span');
                titleSpan.className = 'video-title';
                titleSpan.textContent = title;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<span class="minus">-</span>';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteVideo(url, title);
                };

                // Click handler for rendering video on right side
                rowDiv.onclick = () => {
                    currentVideoIndex = idx;
                    rightVideo(url, title);
                };

                rowDiv.appendChild(rowNumber);
                rowDiv.appendChild(img);
                rowDiv.appendChild(titleSpan);
                rowDiv.appendChild(removeBtn);
                sidebar.appendChild(rowDiv);

                // Save first video to render automatically
                if (!videoLoaded) {
                    currentVideoIndex = 0;
                    firstVideoUrl = url;
                    firstVideoTitle = title;
                    videoLoaded = true;
                }
            });
        });

        // Render first video by default
        if (firstVideoUrl && firstVideoTitle) {
            rightVideo(firstVideoUrl, firstVideoTitle);
        }
    }

    // Helper to extract YouTube video ID from embed URL
    function getYouTubeID(url) {
        const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : '';
    }

    function rightVideo(videoUrl, title) {
        const videoFrame = document.querySelector('.playlist-player .video-frame');
        const videoDetails = document.querySelector('.playlist-player .video-details');

        // Clear previous content
        videoFrame.innerHTML = '';
        videoDetails.innerHTML = '';

        // Add autoplay param if checkbox is checked
        const autoplay = autoPlayVideo();
        const urlWithParams = autoplay ? `${videoUrl}?autoplay=1` : videoUrl;

        // Create and insert iframe for video
        const iframe = document.createElement('iframe');
        iframe.src = urlWithParams;
        iframe.width = '650';
        iframe.height = '400';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.className = 'custom-video-iframe';
        videoFrame.appendChild(iframe);

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        titleElement.className = 'video-titles';
        videoDetails.appendChild(titleElement);
        updateVideoCount();
    }

    function getPlaylistByName(mainResponse, name) {
        console.log("mainResponse", mainResponse);
        const filtered = mainResponse.playlistData.filter(item => {
            const key = Object.keys(item)[0];
            return key === name;
        });
        return filtered;
    }

    const homeBreadcrumb = document.getElementById('breadcrumb-home');

    function goBackToMain() {
        // Hide playlist view
        const main = document.querySelector(".main-playlist-container");
        if (main) main.style.display = "none";

        // Hide breadcrumb
        const breadcrumb = document.querySelector("#dynamicBreadcrumb");
        if (breadcrumb) breadcrumb.style.display = "none";

        // Show main dashboard
        const mainDialog = document.querySelector(".centered-container");
        if (mainDialog) mainDialog.style.display = "block";
    }

    // ----------new -dialog code for playlist--start--------------------------------
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== menuToggle) {
            menu.classList.add('hidden');
        }
    });

    menu.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');

        if (action === 'delete') {
            handleDelete();
        } else if (action === 'rename') {
            handleRename();
        } else if (action === 'changeOrder') {
            handleChangeOrder(playListName, changeOrderVideoOrgList);
        }
        menu.classList.add('hidden');
    });

    function handleDelete() {
        console.log('Delete clicked');
        menu.classList.add('hidden');
    }

    function handleRename() {
        console.log('Rename clicked');
        menu.classList.add('hidden');
    }

    changePlaylistCancel.addEventListener('click', (e) => {
        const changeDialog = document.querySelector('.change-dialog');
        changeDialog.style.display = "none";
    });

    function handleChangeOrder(playListName, changeOrderVideoOrgList) {
        const changeDialog = document.getElementById('changeOrderDialog');
        const changeList = changeDialog.querySelector('.change-list');
        const saveChangePlaylist = document.getElementById('saveChangePlaylist');
        const changePlaylistCancel = document.getElementById('changePlaylistCancel');

        videoList = changeOrderVideoOrgList[0][playListName].map((url, i) => ({
            title: `Video ${i + 1}`,
            url: url
        }));
        console.log("videoList", videoList, changeOrderVideoOrgList);
        changeDialog.style.display = "flex";
        renderDialogList(changeList, videoList);
        saveChangePlaylist.onclick = () => {
            changeDialog.style.display = "none";
            const updatedUrls = videoList.map(v => v.url);
            const payload = {
                "playlistName": playListName,
                "playlistItems": updatedUrls
            }
            console.log("Final ordered URLs:", payload);
            // send to API here
        };

        changePlaylistCancel.onclick = () => {
            changeDialog.style.display = "none";
        };

        // Render function with full circular up/down support
        function renderDialogList(container, videos) {
            container.innerHTML = '';
            const rowDiv1 = document.createElement('div');
            rowDiv1.className = 'playlist-row1';

            videos.forEach((video, index) => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'playlist-row2';
                rowDiv.draggable = true;
                rowDiv.dataset.index = index;

                // Drag Events
                rowDiv.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                    e.currentTarget.classList.add('dragging');
                });

                rowDiv.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('drag-over');
                });

                rowDiv.addEventListener('dragleave', (e) => {
                    e.currentTarget.classList.remove('drag-over');
                });

                rowDiv.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    const toIndex = parseInt(e.currentTarget.dataset.index, 10);
                    if (fromIndex !== toIndex) {
                        const [moved] = videos.splice(fromIndex, 1);
                        videos.splice(toIndex, 0, moved);
                        renderDialogList(container, videos);
                    }
                });

                rowDiv.addEventListener('dragend', (e) => {
                    document.querySelectorAll('.playlist-row2').forEach(el => {
                        el.classList.remove('dragging', 'drag-over');
                    });
                });

                // Controls
                const controls = document.createElement('div');
                controls.className = 'reorder-controls1';

                const upBtn = document.createElement('button');
                upBtn.textContent = '△';
                upBtn.onclick = () => {
                    const [moved] = videos.splice(index, 1);
                    const newIndex = index === 0 ? videos.length : index - 1;
                    videos.splice(newIndex, 0, moved);
                    renderDialogList(container, videos);
                };

                const downBtn = document.createElement('button');
                downBtn.textContent = '▽';
                downBtn.onclick = () => {
                    const [moved] = videos.splice(index, 1);
                    const newIndex = index === videos.length ? 0 : index + 1;
                    videos.splice(newIndex % (videos.length + 1), 0, moved);
                    renderDialogList(container, videos);
                };

                controls.appendChild(upBtn);
                controls.appendChild(downBtn);

                const img = document.createElement('img');
                img.src = getThumbnail(video.url);
                img.className = 'video-thumbnail1';
                img.alt = 'Thumbnail';

                const div1 = document.createElement('div');
                div1.className = 'remove-title';
                const titleSpan = document.createElement('span');
                titleSpan.className = 'video-title1';
                titleSpan.textContent = video.title;

                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '<span class="my-css">-</span>';
                removeBtn.className = 'remove-button';
                removeBtn.onclick = () => {
                    handleRemoveVideo(video.url, playListName);
                };

                rowDiv.appendChild(controls);
                rowDiv.appendChild(img);
                div1.appendChild(titleSpan);
                div1.appendChild(removeBtn);
                rowDiv.appendChild(div1);
                rowDiv1.appendChild(rowDiv);
            });

            container.appendChild(rowDiv1);
        }

        // Helper to get thumbnails
        function getThumbnail(url) {
            if (url.includes('youtube.com')) {
                const match = url.match(/embed\/([0-9A-Za-z_-]{11})/);
                return match ? `https://img.youtube.com/vi/${match[1]}/default.jpg` : '';
            } else if (url.endsWith('.mp4')) {
                return 'https://via.placeholder.com/120x90.png?text=MP4';
            } else {
                return 'https://via.placeholder.com/120x90.png?text=Video';
            }
        }
    }

    async function handleRemoveVideo(url1, playlistName) {
        deleteVideo(url1, playlistName)
        const res1 = await getPlaylistsDataApi();
        const result = filteredData1(res1, playlistName)
        handleChangeOrder(playListName, result);
    }

    function filteredData1(data, name) {
        return data.filter(item => Object.keys(item)[0] === name);
    }

    //========  api call for remaining code here =====================

    // ----------new -dialog code for playlist--end----------------------------------


});