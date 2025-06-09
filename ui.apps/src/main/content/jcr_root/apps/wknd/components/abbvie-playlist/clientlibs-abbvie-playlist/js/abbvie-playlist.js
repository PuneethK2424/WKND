document.addEventListener('DOMContentLoaded', function () {
   document.querySelectorAll('.abbvie-playlist').forEach(componentRoot => {
         // component path from the data attribute
         const componentPath = document.querySelector('.main').dataset.componentPath;
         console.log(componentPath);

         const tabs = componentRoot.querySelectorAll('.tab');
         const contents = componentRoot.querySelectorAll('.content-div');
         const categorySection = componentRoot.querySelector('#categorySection');
         const mediaContainer = componentRoot.querySelector('#content1');
         const categoryItems = componentRoot.querySelectorAll('.category-item');
         const dropdownWrapper = componentRoot.querySelector('.dropdown-wrapper');
         const mobileCategoryDropdown = componentRoot.querySelector('#mobileCategoryDropdown');
         const mobileSelect = componentRoot.querySelector('#mobileCategorySelect');
         const categories = componentRoot.querySelector('.categories');
         const playlistContainer = componentRoot.querySelector('#content2');
         const staticApiResponse = {
            media: {
               categories: {}
            }
         };

         let currentButton = null;
         let currentApi = null;
         let oldName;
         let mainResponse;
         let latestPlayListResponse;
         const checkboxContainer = componentRoot.querySelector('#checkboxContainer');
         const saveBtn = componentRoot.querySelector('#saveCheckboxes');
         const cancelBtn = componentRoot.querySelector('#cancelDialog');
         const newPlaylistDialog = componentRoot.querySelector('#newPlaylistDialog');
         const saveNewPlaylistBtn = componentRoot.querySelector('#saveNewPlaylist');
         const cancelNewPlaylistBtn = componentRoot.querySelector('#cancelNewPlaylist');
         const newPlaylistInput = componentRoot.querySelector('#newPlaylistName');
         const createPlaylist = componentRoot.querySelector('.create-playlist');
         const createPlus = componentRoot.querySelector('.create-plus');
         const dialogTitle = componentRoot.querySelector('#dialogTitle');

         const cancelRenamePlaylist = componentRoot.querySelector('#renamePlaylistCancel');
         const saveRenamePlaylist = componentRoot.querySelector('#saveRenamePlaylist');
         const renamePlaylistDialog = componentRoot.querySelector('#RenameDialog');
         const renamePlaylistInput = componentRoot.querySelector('#renamePlaylistName');
         const noPlaylists = componentRoot.querySelector('#no-playlists-message');

         const menuToggle = componentRoot.querySelector('#menu-toggle');
         const menu = componentRoot.querySelector('#menu');

         const changePlaylistCancel = componentRoot.querySelector('#changePlaylistCancel');
         const saveChangePlaylist = componentRoot.querySelector('#saveChangePlaylist');
         let playListName;
         let selectedPlaylistName = null;
         let changeOrderVideoOrgList;
         let videoList;
         let totalVideos = 0;
         let currentVideoIndex = 0;

         const dropdownToggle = componentRoot.querySelector('#mobileCategoryDropdown .dropdown-toggle');
         const dropdownOptions = componentRoot.querySelector('#mobileCategoryDropdown .dropdown-options');
         const dropdownIcon = componentRoot.querySelector('#mobileCategoryDropdown .dropdown-icon');
         const selectedText = componentRoot.querySelector('#mobileCategoryDropdown .selected-text');
         const options = componentRoot.querySelectorAll('#mobileCategoryDropdown .dropdown-option');
         //=====snack bar-code-start======================================
         let snackBarTimeout;
         let closeListenerAttached = false;

         function snackBarMessage(message, type = 'success') {
            const snackBar = componentRoot.querySelector("#snackBar");
            const messageSpan = snackBar.querySelector(".snack-message") || document.createElement('span');
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
            const snackBar = componentRoot.querySelector("#snackBar");
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
            const tabs = componentRoot.querySelectorAll(".tab");
            const contents = componentRoot.querySelectorAll(".content-div");
            tabs.forEach(tab => tab.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
         }

         // Navigates back to the Media tab (content1)
function goBackToMedia() {
    const main = componentRoot.querySelector(".main-playlist-container");
    if (main) main.style.display = "none";

    const breadcrumb = componentRoot.querySelector("#dynamicBreadcrumb");
    if (breadcrumb) breadcrumb.style.display = "none";

   componentRoot.style.display = "block";

    const mediaTab = componentRoot.querySelector('.tab[data-tab="content1"]');
    if (mediaTab) {
        resetTabs(); // Reset all tabs and content
        mediaTab.classList.add("active"); // Activate the Media tab
        const targetContent = componentRoot.querySelector("#content1");
        if (targetContent) {
            targetContent.classList.add("active");
            targetContent.style.display = "block"; // Explicitly show #content1
        }
        const activeIndex = componentRoot.querySelector(".category-item.active")?.dataset.categoryIndex || 0;
        renderCategoryContent(activeIndex); // Render Media tab content
        updateCategoryVisibility(); // Update category visibility
    } else {
        console.error("Media tab not found!");
    }
}

         function resetPlusIcon() {
            if (currentButton) {
               currentButton.textContent = '+';
               currentButton = null;
            }
         }

         function openNewPlaylistDialog() {
            const videoDialog = componentRoot.querySelector('#videoDialog');
            if (videoDialog) videoDialog.style.display = 'none';
            newPlaylistInput.value = '';
            newPlaylistDialog.style.display = 'flex';
            document.body.classList.add('dialog-open');
         }

         function renderCheckboxes(options) {
            checkboxContainer.innerHTML = '';
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

         // Close dropdowns when clicking outside (scoped to componentRoot)
         componentRoot.addEventListener('click', (event) => {
            if (!event.target.closest('.options-wrapper')) {
               componentRoot.querySelectorAll('.dropdown').forEach(dropdown => {
                  dropdown.classList.add('hidden');
               });
            }
         });

         // ================================
         // DATA CONSTRUCTION
         // ================================
         const playlistDivs = componentRoot.querySelectorAll('#playlist-data .playlist');
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
                     videoUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl,
                     videoThumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : '',
                  });
               });

               category.questions[qIndex] = {
                  question: questionText,
                  videoList: videoList,
               };
            });

            staticApiResponse.media.categories[pIndex] = category;
         });

         // Populate mobile category dropdown
         if (mobileSelect && staticApiResponse.media && staticApiResponse.media.categories) {
            Object.values(staticApiResponse.media.categories).forEach((category, index) => {
               const option = document.createElement('option');
               option.value = index;
               option.textContent = category.category;
               mobileSelect.appendChild(option);
            });
         }

         // Populate desktop category items
         const categoriesContainer = componentRoot.querySelector('#categories');
         if (categoriesContainer) {
            Object.values(staticApiResponse.media.categories).forEach((category, index) => {
               const item = document.createElement('div');
               item.className = 'category-item';
               item.dataset.categoryIndex = index;
               item.textContent = category.category;
               categoriesContainer.appendChild(item);
            });
         }

         // Re-query category items after populating
         const updatedCategoryItems = componentRoot.querySelectorAll('.category-item');

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

                  componentRoot.querySelectorAll('.accordion-body').forEach(body => body.classList.remove('active'));
                  componentRoot.querySelectorAll('.accordion-header').forEach(header => {
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

         // Function to update category visibility based on screen size and active tab
         function updateCategoryVisibility() {
            const activeTab = componentRoot.querySelector('.tab.active');
            if (!activeTab) return;

            const targetId = activeTab.dataset.tab;

            if (targetId === 'content1') {
               playlistContainer.style.display = 'none';

               if (window.innerWidth <= 767) {
                  categorySection.style.display = 'none';
                  categories.style.display = 'none';
                  if (dropdownWrapper) {
                  dropdownWrapper.style.display = 'block';
                     console.log("Mobile view: Showing dropdown-wrapper for categories");
               }
               } else {
                  categorySection.style.display = 'block';
                  categories.style.display = 'block';
                  if (dropdownWrapper) {
                  dropdownWrapper.style.display = 'none';
                   console.log("Desktop view: Hiding dropdown-wrapper, showing categories");
               }
               }
            } else if (targetId === 'content2') {
               categorySection.style.display = 'none';
               categories.style.display = 'none';
              if (dropdownWrapper) {
                  dropdownWrapper.style.display = 'none';
               }
               playlistContainer.style.display = 'grid';

            }
         }

         // ================================
         // EVENT LISTENERS
         // ================================
         updatedCategoryItems.forEach(item => {
            item.addEventListener('click', function () {
               updatedCategoryItems.forEach(i => i.classList.remove('active'));
               this.classList.add('active');
               renderCategoryContent(this.dataset.categoryIndex);
               if (selectedText) {
               const category = staticApiResponse.media.categories[this.dataset.categoryIndex];
               selectedText.textContent = category ? category.category : 'Select category';
            }
            });
         });

         tabs.forEach(tab => {
            tab.addEventListener("click", function () {
               resetTabs();
               tab.classList.add("active");

               const targetId = tab.dataset.tab;
               const targetContent = componentRoot.querySelector(`#${targetId}`);

               if (targetContent) targetContent.classList.add("active");

               if (targetId === "content1") {
                  const activeIndex = componentRoot.querySelector(".category-item.active")?.dataset.categoryIndex || 0;
                  renderCategoryContent(activeIndex);
               } else {
                  renderPlaylist();
               }
               updateCategoryVisibility();
            });
         });

         if (updatedCategoryItems.length > 0) {
            updatedCategoryItems[0].classList.add('active');
            updatedCategoryItems[0].click();
            updateCategoryVisibility();
         }

         if (mobileSelect) {
            mobileSelect.addEventListener('change', function () {
               const selectedIndex = this.value;
               const desktopCategory = componentRoot.querySelector(`.category-item[data-category-index="${selectedIndex}"]`);
               if (desktopCategory) desktopCategory.click();
            });
         }

             if (dropdownToggle && dropdownOptions && dropdownIcon && selectedText && options) {
            // Toggle dropdown visibility
            dropdownToggle.addEventListener('click', () => {
               dropdownOptions.classList.toggle('open');
               dropdownIcon.classList.toggle('open');
            });

            // Handle option selection
            options.forEach(option => {
               option.addEventListener('click', () => {
                  const value = option.getAttribute('data-value');
                  const text = option.textContent;
                  selectedText.textContent = text;
                  dropdownOptions.classList.remove('open');
                  dropdownIcon.classList.remove('open');
                  // Trigger the same behavior as mobileSelect change
                  const desktopCategory = componentRoot.querySelector(`.category-item[data-category-index="${value}"]`);
                 if (desktopCategory) {
                  categoryItems.forEach(i => i.classList.remove('active'));
                  desktopCategory.classList.add('active');
                  renderCategoryContent(value);
               }
               });
            });

            // Close dropdown if clicking outside
            document.addEventListener('click', (e) => {
               if (!dropdownToggle.contains(e.target) && !dropdownOptions.contains(e.target)) {
                  dropdownOptions.classList.remove('open');
                  dropdownIcon.classList.remove('open');
               }
            });
         }
         window.addEventListener('resize', updateCategoryVisibility);

         // Scoped dialog interactions
         componentRoot.addEventListener('click', async function (e) {
            const target = e.target;
            if (target.classList.contains('open-dialog')) {
               e.stopPropagation();
               currentButton = target;
               currentButton.textContent = '−';
               currentApi = target.dataset.url;

               const options = await getPlaylistsApi();
               renderCheckboxes(options);

               const videoDialog = componentRoot.querySelector('#videoDialog');
               if (videoDialog) {
                  videoDialog.style.display = 'flex';
                  document.body.classList.add('dialog-open');
               }
            }

            if (target.classList.contains('close-dialog')) {
               e.stopPropagation();
               const videoDialog = componentRoot.querySelector('#videoDialog');
               if (videoDialog) {
                  videoDialog.style.display = 'none';
                  document.body.classList.remove('dialog-open');
               }
               resetPlusIcon();
            }
         });

         cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const videoDialog = componentRoot.querySelector('#videoDialog');
            if (videoDialog) {
               videoDialog.style.display = 'none';
               document.body.classList.remove('dialog-open');
            }
            resetPlusIcon();
         });

         saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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

            const videoDialog = componentRoot.querySelector('#videoDialog');
            if (videoDialog) {
               videoDialog.style.display = 'none';
               document.body.classList.remove('dialog-open');
            }
            resetPlusIcon();
         });

         createPlaylist.addEventListener('click', (e) => {
            e.stopPropagation();
            openNewPlaylistDialog();
         });

         createPlus.addEventListener('click', (e) => {
            e.stopPropagation();
            openNewPlaylistDialog();
         });

         saveNewPlaylistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const playlistName = newPlaylistInput.value.trim();
            if (!playlistName) return alert('Please enter a playlist name.');
            createPlaylistApi({
               playlistName,
               videoId: currentApi
            });
            newPlaylistDialog.style.display = 'none';
            const videoDialog = componentRoot.querySelector('#videoDialog');
            if (videoDialog) {
               videoDialog.style.display = 'none';
               document.body.classList.remove('dialog-open');
            }
            resetPlusIcon();
         });

         cancelNewPlaylistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            newPlaylistDialog.style.display = 'none';
            const videoDialog = componentRoot.querySelector('#videoDialog');
            if (videoDialog) {
               videoDialog.style.display = 'flex';
            }
            document.body.classList.remove('dialog-open');
            resetPlusIcon();
         });

         //=============rename-dialog-logic-start=============
         saveRenamePlaylist.addEventListener('click', async (e) => {
            e.stopPropagation();
            const renamePlaylistName = renamePlaylistInput.value.trim();
            if (!renamePlaylistName) return alert('Please enter a playlist name.');
            await renamePlaylist(renamePlaylistName, oldName || selectedPlaylistName);
            oldName = null;
            renamePlaylistDialog.style.display = 'none';
            document.body.classList.remove('dialog-open');
            renamePlaylistInput.dataset.oldName = '';
            renamePlaylistInput.value = '';
            await renderPlaylist();
         });

         cancelRenamePlaylist.addEventListener('click', (e) => {
            e.stopPropagation();
            renamePlaylistDialog.style.display = 'none';
            document.body.classList.remove('dialog-open');
         });

         // ================================
         // API FUNCTIONS
         // ================================
         function renamePlaylist(newName, oldName) {
            const renamePlaylistName = {
               previousPlaylistName: oldName,
               playlistName: newName
            };

            return fetch('/libs/granite/csrf/token.json')
               .then(res => res.json())
               .then(csrf => {
                  return fetch(componentPath + '.renamePlaylist.json', {
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
                     snackBarMessage(data.message, data.status);
                  } else {
                     snackBarMessage(data.message, "error");
                  }
               })
               .catch(err => {
                  const errorMessage = typeof err === 'string' ? err : 'An error occurred';
                  snackBarMessage(errorMessage, "error");
               });
         }

         function getPlaylistsApi() {
            return fetch('/libs/granite/csrf/token.json')
               .then(res => res.json())
               .then(csrf => {
                  return fetch(componentPath + '.playlistNames.json', {
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
                  if (response.status === "success") {
                     return response.playlistNames || [];
                  } else {
                     snackBarMessage(response.message, "error");
                     return [];
                  }
               })
               .catch(err => {
                  const errorMessage = typeof err === 'string' ? err : 'An error occurred';
                  snackBarMessage(errorMessage, "error");
                  return [];
               });
         }

         function addVideoToPlaylists(payload) {
            fetch('/libs/granite/csrf/token.json')
               .then(res => res.json())
               .then(csrf => {
                  fetch(componentPath + '.addVideo.json', {
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
                        const errorMessage = typeof err === 'string' ? err : 'An error occurred';
                        snackBarMessage(errorMessage, "error");
                     });
               });
         }

         function createPlaylistApi(payload) {
            fetch('/libs/granite/csrf/token.json')
               .then(res => res.json())
               .then(csrf => {
                  fetch(componentPath + '.createPlaylist.json', {
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
                        const errorMessage = typeof err === 'string' ? err : 'An error occurred';
                        snackBarMessage(errorMessage, "error");
                     });
               });
         }

         async function getPlaylistsDataApi() {
            try {
               const csrfRes = await fetch('/libs/granite/csrf/token.json');
               const csrf = await csrfRes.json();

               const playlistDataResponse = await fetch(componentPath + '.playlistsData.json', {
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
               } else {
                  snackBarMessage(mainResponse.message || 'Failed to fetch playlists', "error");
                  return [];
               }
            } catch (err) {
               const errorMessage = typeof err === 'string' ? err : 'An error occurred';
               snackBarMessage(errorMessage, "error");
               return [];
            }
         }

         function changeOrderApi(payload) {
            fetch('/libs/granite/csrf/token.json')
               .then(res => res.json())
               .then(csrf => {
                  fetch(componentPath + '.rearrangeVideos.json', {
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
                           snackBarMessage(data.message || 'Order changed successfully', data.status);
                        } else {
                           snackBarMessage(data.message || 'Order change was unsuccessful', 'error');
                        }
                        return data;
                     })
                     .catch(err => {
                        const errorMessage = typeof err === 'string' ? err : 'Failed to change video order';
                        snackBarMessage(errorMessage, "error");
                     });
               });
         }

         function deletePlaylist(payload) {
            fetch('/libs/granite/csrf/token.json')
               .then(res => res.json())
               .then(csrf => {
                  fetch(componentPath + '.deletePlaylist.json', {
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
                           snackBarMessage(data.message || 'Playlist deletion was successful', data.status);
                        } else {
                           snackBarMessage(data.message || 'Playlist deletion was unsuccessful', "error");
                        }
                        return data;
                     })
                     .catch(err => {
                        const errorMessage = typeof err === 'string' ? err : 'Failed to delete playlist';
                        snackBarMessage(errorMessage, "error");
                     });
               });
         }

         function deleteVideo(url, title) {
            fetch('/libs/granite/csrf/token.json')
               .then(res => res.json())
               .then(csrf => {
                  fetch(componentPath + '.deleteVideo.json', {
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
                           snackBarMessage(data.message || 'Video deletion was successful', data.status);
                        } else {
                           snackBarMessage(data.message || 'Video deletion was unsuccessful', "error");
                        }
                        return data;
                     })
                     .catch(err => {
                        const errorMessage = typeof err === 'string' ? err : 'Failed to delete video';
                        snackBarMessage(errorMessage, "error");
                     });
               });
         }

         //=====render playlist tab-cards-----start---- =================
         async function renderPlaylist() {
            const playlistContainer = componentRoot.querySelector('#content2');
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
               playlistDiv.addEventListener('click', () => {
                  selectedPlaylistName = name;
               });
               const a = document.createElement('a');
               a.href = '#';
               const img = document.createElement('img');
               img.src = playlistObject.thumbnailUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMS0W4MCaiGuG6gl3NnQ3dq3jTB0coMwNI8g&s';
               img.alt = `${name} thumbnail`;
               a.appendChild(img);
               a.addEventListener('click', async (event) => {
                  event.preventDefault();
                  playListName = name;
                  await playListVideos(name);
               });

               const playlistItemsContainer = document.createElement('div');
               playlistItemsContainer.className = 'playlist-item-container';

               const info = document.createElement('div');
               info.className = 'playlist-info';
               info.innerHTML = `${name} <br> ${videoUrls.length} items`;

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

               renameOption.addEventListener('click', (e) => {
                  e.stopPropagation();
                  oldName = name;
                  renamePlaylistDialog.style.display = "flex";
                  document.body.classList.add('dialog-open');
                  renamePlaylistInput.value = name;
                  renamePlaylistInput.dataset.oldName = name;
                  dropdown.classList.add('hidden');
               });

               deleteOption.addEventListener('click', (e) => {
                  e.stopPropagation();
                  dropdown.classList.add('hidden');
                  handleDelete(name);
               });

               dropdown.appendChild(renameOption);
               dropdown.appendChild(deleteOption);
               optionsWrapper.appendChild(ellipsis);
               optionsWrapper.appendChild(dropdown);

               ellipsis.addEventListener('click', (e) => {
                  e.stopPropagation();
                  dropdown.classList.toggle('hidden');
               });

               playlistItemsContainer.appendChild(info);
               playlistItemsContainer.appendChild(optionsWrapper);

               playlistDiv.appendChild(a);
               playlistDiv.appendChild(playlistItemsContainer);

               playlistContainer.appendChild(playlistDiv);
            });
         }

         //=====playlist-video-render-function==start=================
         function playListVideos(name) {
            const filteredData = getPlaylistByName(mainResponse, name);
            const mainDialog = componentRoot.querySelector(".centered-container");
            if (mainDialog) mainDialog.style.display = "none";
            const main = componentRoot.querySelector(".main-playlist-container");
            if (main) main.style.display = "flex";
            const breadcrumb = componentRoot.querySelector("#dynamicBreadcrumb");
            if (!breadcrumb) {
               console.error("Breadcrumb (#dynamicBreadcrumb) not found! Delaying execution...");
               setTimeout(() => playListVideos(name), 100);
               return;
            }
            breadcrumb.style.display = "flex";
            const current = breadcrumb.querySelector("#breadcrumb-current");
           if (current) current.textContent = name;
            const homeBreadcrumb = breadcrumb.querySelector("#breadcrumb-home");
            const defaultBreadcrumb = breadcrumb.querySelector("#breadcrumb-default");
                 if (homeBreadcrumb) {
            homeBreadcrumb.style.cursor = "pointer";
            homeBreadcrumb.removeEventListener("click", goBackToMain); // Remove any old listener
            homeBreadcrumb.addEventListener("click", (event) => {
            event.stopPropagation();
            goBackToMedia(); // Navigate to Media tab
        });
    }
              if (defaultBreadcrumb) {
        defaultBreadcrumb.style.cursor = "pointer";
        defaultBreadcrumb.removeEventListener("click", goBackToMain); // Remove any old listener
        defaultBreadcrumb.addEventListener("click", (event) => {
            event.stopPropagation();
            goBackToMain(); // Navigate to My Playlists tab
        });
    }

         changeOrderVideoOrgList = filteredData;
         const sidebar = componentRoot.querySelector(".playlist-items");
         if (sidebar) leftSidebar(sidebar, filteredData);
      }

      function updateVideoCount() {
         const videoCountElement = componentRoot.querySelector('.video-count');
         const totalCountTag = componentRoot.querySelector('.total-count');
         if (totalCountTag) totalCountTag.textContent = `${totalVideos} items | 6:31:23`;
         if (videoCountElement) videoCountElement.textContent = `${currentVideoIndex + 1}/${totalVideos}`;
      }

      function autoPlayVideo() {
         const checkbox = componentRoot.querySelector("#autoplay-switch");
         return checkbox && checkbox.checked;
      }

      //================================================delete video dialog logic===
      let deleteTarget = {
         url: "",
         title: ""
      };

      const confirmVideoDelete = componentRoot.querySelector('#confirm-video-delete');
      const cancelVideoDelete = componentRoot.querySelector('#cancel-video-delete');

    function setupDeleteVideoDialogListeners() {
   const dialog = componentRoot.querySelector('#deleteVideoDialog');
   const confirmButton = componentRoot.querySelector('#confirm-video-delete');
   const cancelButton = componentRoot.querySelector('#cancel-video-delete');

   if (!dialog || !confirmButton || !cancelButton) return;

   confirmButton.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteVideo(deleteTarget.url, deleteTarget.title);
      dialog.style.display = 'none';
      document.body.classList.remove('dialog-open');
   });

   cancelButton.addEventListener('click', (e) => {
      e.stopPropagation();
      dialog.style.display = 'none';
      document.body.classList.remove('dialog-open');
   });
}



      //============================delete video dialog end==================

      function leftSidebar(sidebar, filteredData) {
         sidebar.innerHTML = '';
           let playlist = [];
         let firstVideoUrl = null;
         let firstVideoTitle = null;
         let videoLoaded = false;

         filteredData.forEach((item, index) => {
            const key = Object.keys(item)[0];
            const videoUrls = item[key];
            const title = key;
            totalVideos = videoUrls.length;

            videoUrls.forEach((url, idx) => {
               const videoId = getYouTubeID(url);
               const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/default.jpg`;

                   playlist.push({ url, title, index: idx + 1 });
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
               removeBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  deleteTarget = {
                     url,
                     title
                  };
                  const dialog = componentRoot.querySelector('#deleteVideoDialog');
                  if (dialog) {
                     dialog.style.display = 'block';
                     dialog.style.zIndex = '99999';
                     document.body.classList.add('dialog-open');
                     setupDeleteVideoDialogListeners(async () => {
                        latestPlayListResponse = await getPlaylistsDataApi();
                        const result = filteredData1(latestPlayListResponse, playListName);
                        if (sidebar) leftSidebar(sidebar, result);
                     });
                  }
               });

               rowDiv.addEventListener('click', () => {
                  const allRows = sidebar.querySelectorAll('.playlist-row');
                  allRows.forEach(row => row.classList.remove('active-row'));
                  rowDiv.classList.add('active-row');
                  currentVideoIndex = idx;
                  rightVideo(url, title,idx + 1);
               });

               rowDiv.appendChild(rowNumber);
               rowDiv.appendChild(img);
               rowDiv.appendChild(titleSpan);
               rowDiv.appendChild(removeBtn);
               sidebar.appendChild(rowDiv);

               if (!videoLoaded) {
                  currentVideoIndex = 0;
                  firstVideoUrl = url;
                  firstVideoTitle = title;
                  videoLoaded = true;
                  rowDiv.classList.add('active-row');
               }
            });
         });

         if (!videoLoaded) {
            clearRightVideo();
         } else {
            rightVideo(firstVideoUrl, firstVideoTitle,currentVideoIndex + 1);
         }
      }

      function getYouTubeID(url) {
         const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
         return match ? match[1] : '';
      }

      function rightVideo(videoUrl, title,idx) {
          console.log("videoUrl, title,idx",videoUrl, title,idx);
         const videoFrame = componentRoot.querySelector('.playlist-player .video-frame');
         const videoDetails = componentRoot.querySelector('.playlist-player .video-details');

         if (!videoFrame || !videoDetails) return;

         videoFrame.innerHTML = '';
         videoDetails.innerHTML = '';

         const autoplay = autoPlayVideo();
         const urlWithParams = autoplay ? `${videoUrl}?autoplay=1` : videoUrl;

         const iframe = document.createElement('iframe');
         iframe.width = '670';
         iframe.height = '400';
         iframe.src = urlWithParams;
         iframe.frameBorder = '0';
         iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
         iframe.allowFullscreen = true;
         iframe.className = 'custom-video-iframe';
         videoFrame.appendChild(iframe);

         const titleElement = document.createElement('h3');
         const displayIndex = idx !== undefined ? idx : 1;
        titleElement.textContent = `${displayIndex}) ${title}`;
         titleElement.className = 'video-titles';
         videoDetails.appendChild(titleElement);

           const ellipsis = document.createElement('div');
            ellipsis.innerHTML = '&#8942;'; // HTML entity for …
            ellipsis.className = 'video-ellipsis-symbol';
            videoDetails.appendChild(ellipsis);


          // Create menu
const menu = document.createElement('div');
menu.className = 'video-options-menu';
menu.innerHTML = `<div class="menu-item">Delete</div>`;
menu.style.display = 'none'; // initially hidden
videoDetails.appendChild(menu);

// Toggle menu on ellipsis click
ellipsis.addEventListener('click', () => {
  menu.style.display = (menu.style.display === 'none') ? 'block' : 'none';
});

// Optionally: Hide menu if clicking outside
document.addEventListener('click', (e) => {
  if (!ellipsis.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});
     menu.querySelector('.menu-item').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTarget = {
                url: videoUrl,
                title: playListName
            };
            const dialog = componentRoot.querySelector('#deleteVideoDialog');
            if (dialog) {
                dialog.style.display = 'block';
                dialog.style.zIndex = '99999';
                document.body.classList.add('dialog-open');
                setupDeleteVideoDialogListeners(async () => {
                    latestPlayListResponse = await getPlaylistsDataApi();
                    const result = filteredData1(latestPlayListResponse, playListName);
                    const sidebar = componentRoot.querySelector(".playlist-items");
                    if (sidebar) leftSidebar(sidebar, result);
                });
            }
        });

    updateVideoCount();

 }

      function getPlaylistByName(mainResponse, name) {
         if (!mainResponse || !mainResponse.playlistData) return [];
         return mainResponse.playlistData.filter(item => {
            const key = Object.keys(item)[0];
            return key === name;
         });
      }

      // Navigates back to the My Playlists tab (content2)
function goBackToMain() {
   const main = componentRoot.querySelector(".main-playlist-container");
   if (main) main.style.display = "none";

    const breadcrumb = componentRoot.querySelector("#dynamicBreadcrumb");
    if (breadcrumb) breadcrumb.style.display = "none";

     const mainDialog = componentRoot.querySelector(".centered-container");
      if (mainDialog) mainDialog.style.display = "block";
}

 menuToggle.addEventListener('click', (e) => {
         e.stopPropagation();
         menu.classList.toggle('hidden');
      });

      componentRoot.addEventListener('click', (e) => {
         if (!menu.contains(e.target) && e.target !== menuToggle) {
            menu.classList.add('hidden');
         }
      });

      menu.addEventListener('click', (e) => {
         e.stopPropagation();
         const action = e.target.getAttribute('data-action');

         if (action === 'delete') {
            handleDelete(selectedPlaylistName);
         } else if (action === 'rename') {
            handleRename(selectedPlaylistName);
         } else if (action === 'changeOrder') {
            const filteredData = getPlaylistByName(mainResponse, playListName);
            handleChangeOrder(playListName, filteredData);
         }
         menu.classList.add('hidden');
      });

      function handleDelete(name) {
         selectedPlaylistName = name;
         const model = componentRoot.querySelector('#delete-model');
         const confirmBtn = componentRoot.querySelector('#confirm-delete');
         const cancelBtn = componentRoot.querySelector('#cancel-delete');

         if (!model || !confirmBtn || !cancelBtn) return;

         model.classList.remove('hidden');
         document.body.classList.add('dialog-open');

         // Remove existing listeners to prevent duplicates
         const newConfirm = confirmBtn.cloneNode(true);
         const newCancel = cancelBtn.cloneNode(true);
         confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
         cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

         newConfirm.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePlaylist({
               playlistName: selectedPlaylistName
            });
            model.classList.add('hidden');
            document.body.classList.remove('dialog-open');
            setTimeout(() => renderPlaylist(), 500);
         });

         newCancel.addEventListener('click', (e) => {
            e.stopPropagation();
            model.classList.add('hidden');
            document.body.classList.remove('dialog-open');
         });
      }

      function handleRename(oldName) {
         const renameDialog = componentRoot.querySelector('#RenameDialog');
         const renameInput = componentRoot.querySelector('#renamePlaylistName');
         const saveBtn = componentRoot.querySelector('#saveRenamePlaylist');
         const cancelBtn = componentRoot.querySelector('#renamePlaylistCancel');

         if (!renameDialog || !renameInput || !saveBtn || !cancelBtn) return;

         renameDialog.style.display = 'block';
         document.body.classList.add('dialog-open');
         renameInput.value = oldName || selectedPlaylistName || '';

         const newSaveBtn = saveBtn.cloneNode(true);
         const newCancelBtn = cancelBtn.cloneNode(true);

         saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
         cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

         newSaveBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newName = renameInput.value.trim();
            if (newName) {
               await renamePlaylist(newName, oldName || selectedPlaylistName);
               renameDialog.style.display = 'none';
               document.body.classList.remove('dialog-open');
               setTimeout(() => renderPlaylist(), 500);
            } else {
               alert("Playlist name can't be empty.");
            }
         });

         newCancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            renameDialog.style.display = 'none';
            document.body.classList.remove('dialog-open');
         });
      }

      function handleChangeOrder(playListName, changeOrderVideoOrgList) {
         const changeDialog = componentRoot.querySelector('#changeOrderDialog');
         const changeList = changeDialog.querySelector('.change-list');
         const saveChangePlaylist = componentRoot.querySelector('#saveChangePlaylist');
         const changePlaylistCancel = componentRoot.querySelector('#changePlaylistCancel');

         if (!changeDialog || !changeList || !saveChangePlaylist || !changePlaylistCancel) return;

         videoList = changeOrderVideoOrgList[0][playListName].map((url, i) => ({
            title: `Video ${i + 1}`,
            url: url
         }));

         const sidebar = componentRoot.querySelector(".playlist-items");
         changeDialog.style.display = "flex";
         document.body.classList.add('dialog-open');
         renderDialogList(changeList, videoList);

         // Remove existing listeners to prevent duplicates
         const newSaveBtn = saveChangePlaylist.cloneNode(true);
         const newCancelBtn = changePlaylistCancel.cloneNode(true);
         saveChangePlaylist.parentNode.replaceChild(newSaveBtn, saveChangePlaylist);
         changePlaylistCancel.parentNode.replaceChild(newCancelBtn, changePlaylistCancel);

         newSaveBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            changeDialog.style.display = "none";
            document.body.classList.remove('dialog-open');
            const updatedUrls = videoList.map(v => v.url);
            const payload = {
               "playlistName": playListName,
               "playlistItems": updatedUrls
            };
            await changeOrderApi(payload);
            setTimeout(async () => {
               const result = await getPlaylistsDataApi();
               const respo = filteredData1(result, playListName);
               if (sidebar) leftSidebar(sidebar, respo);
            }, 500);
         });

         newCancelBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            changeDialog.style.display = "none";
            document.body.classList.remove('dialog-open');
            const result = await getPlaylistsDataApi();
            const respo = filteredData1(result, playListName);
            if (sidebar) leftSidebar(sidebar, respo);
         });

         function renderDialogList(container, videos) {
            container.innerHTML = '';
            const rowDiv1 = document.createElement('div');
            rowDiv1.className = 'playlist-row1';

            videos.forEach((video, index) => {
               const rowDiv = document.createElement('div');
               rowDiv.className = 'playlist-row2';
               rowDiv.draggable = true;
               rowDiv.dataset.index = index;

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
                  componentRoot.querySelectorAll('.playlist-row2').forEach(el => {
                     el.classList.remove('dragging', 'drag-over');
                  });
               });

               const controls = document.createElement('div');
               controls.className = 'reorder-controls1';

               const upBtn = document.createElement('button');
               upBtn.textContent = '△';
               upBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const [moved] = videos.splice(index, 1);
                  const newIndex = index === 0 ? videos.length : index - 1;
                  videos.splice(newIndex, 0, moved);
                  renderDialogList(container, videos);
               });

               const downBtn = document.createElement('button');
               downBtn.textContent = '▽';
               downBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const [moved] = videos.splice(index, 1);
                  const newIndex = index === videos.length ? 0 : index + 1;
                  videos.splice(newIndex % (videos.length + 1), 0, moved);
                  renderDialogList(container, videos);
               });

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
                  removeBtn.addEventListener('click', (e) => {
                   e.stopPropagation();
                   handleRemoveVideo(video.url, playListName);
                 });
             /*  removeBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  deleteTarget = {
                     url: video.url,
                     title: playListName
                  };
                   const dialog = componentRoot.querySelector('#deleteVideoDialog');
            if (dialog) {
                dialog.style.display = 'block';
                dialog.style.zIndex = '99999';
                document.body.classList.add('dialog-open');
                setupDeleteVideoDialogListeners(() => {
                    // Check if we're in the "Change Order" dialog context
                    const changeOrderDialog = componentRoot.querySelector('#changeOrderDialog');
                    if (changeOrderDialog && changeOrderDialog.style.display === 'flex') {
                        // In "Change Order" dialog, call handleRemoveVideo(video.url, playListName)
                        handleRemoveVideo(video.url, playListName);
                    } else {
                        // In normal left sidebar context, call handleRemoveVideo(url, title)
                        handleRemoveVideo(video.url, video.title);
                    }
                });
            }
        });*/

               rowDiv.appendChild(controls);
               rowDiv.appendChild(img);
               div1.appendChild(titleSpan);
               div1.appendChild(removeBtn);
               rowDiv.appendChild(div1);
               rowDiv1.appendChild(rowDiv);
            });

            container.appendChild(rowDiv1);
         }

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
         await deleteVideo(url1, playlistName);
         setTimeout(async () => {
            latestPlayListResponse = await getPlaylistsDataApi();
            const result = filteredData1(latestPlayListResponse, playlistName);
            handleChangeOrder(playListName, result);
         }, 500);
      }

      function filteredData1(data, name) {
         return data.filter(item => Object.keys(item)[0] === name);
      }

      function clearRightVideo() {
         const videoContainer = componentRoot.querySelector('.playlist-player .video-frame');
         const videoDetails = componentRoot.querySelector('.playlist-player .video-details');
         if (videoContainer) {
            videoDetails.innerHTML = '';
            videoContainer.innerHTML = '<p style="display: flex; justify-content: space-around; padding-top: 45%;">No video to render</p>';

         }
      }
   });
});