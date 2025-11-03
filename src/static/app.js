document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML. Show a friendly message if empty.
        // Each participant gets a small remove button (data attributes used for the handler).
        const participantsHtml = details.participants && details.participants.length > 0
          ? `<ul class="participants-list">${details.participants.map(p => `<li data-email="${p}">${p} <button class=\"remove-btn\" data-activity=\"${name}\" data-email=\"${p}\" title=\"Unregister\">🗑</button></li>`).join("")}</ul>`
          : `<div class="empty">No participants yet</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach click handlers to remove buttons inside this activity card
        const removeButtons = activityCard.querySelectorAll('.remove-btn');
        removeButtons.forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const activityName = btn.dataset.activity;
            const email = btn.dataset.email;

            if (!activityName || !email) return;

            try {
              const res = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, { method: 'POST' });
              const data = await res.json();

              if (res.ok) {
                // Remove the participant element from the DOM
                const li = btn.closest('li');
                if (li) li.remove();

                messageDiv.textContent = data.message || 'Participant unregistered';
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');

                // Refresh activities after a short delay to update counts
                setTimeout(fetchActivities, 700);
              } else {
                messageDiv.textContent = data.detail || 'Failed to unregister participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }

              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              console.error('Error unregistering participant:', err);
              messageDiv.textContent = 'Error unregistering participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
