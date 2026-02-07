from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Visiting page...")
        page.goto("http://localhost:3000")

        print("Finding project link...")
        # Assuming we have a project. If not, create one.
        if not page.locator("div.border.rounded-lg").filter(has_text="Test Project Red").count():
            print("Creating project...")
            page.get_by_role("button", name="Create New Project").click()
            page.get_by_placeholder("Project Name").fill("Test Project Red")
            page.get_by_role("button", name="Create").click()
            time.sleep(1)

        # Navigate to project detail
        # Project List usually renders as Link or div inside Link
        # Find the project card. It should be a link.
        # Looking at ProjectList.tsx (assumed) structure: <Link href={`/projects/${project.id}`}>...</Link>
        project_card = page.locator("a[href^='/projects/']").filter(has_text="Test Project Red").first

        if not project_card.is_visible():
             # Fallback if no link found, maybe create failed or not loaded
             print("Project card not found, retrying creation...")
             page.get_by_role("button", name="Create New Project").click()
             page.get_by_placeholder("Project Name").fill("Test Project Red")
             page.get_by_role("button", name="Create").click()
             time.sleep(1)
             project_card = page.locator("a[href^='/projects/']").filter(has_text="Test Project Red").first

        print("Clicking project...")
        project_card.click(force=True)

        print("Waiting for Gantt Chart...")
        expect(page.get_by_text("Drag here to create...")).to_be_visible()

        # Get the row
        drag_row = page.get_by_text("Drag here to create...").first
        # Parent row container
        row_container = drag_row.locator("xpath=..")

        print("Dragging to create task in Gantt...")
        box = row_container.bounding_box()
        if box:
            start_x = box["x"] + 250
            end_x = box["x"] + 450
            y = box["y"] + box["height"] / 2

            page.mouse.move(start_x, y)
            page.mouse.down()
            page.mouse.move(end_x, y)
            page.mouse.up()

            print("Filling modal...")
            expect(page.get_by_role("heading", name="Create Task")).to_be_visible()
            page.get_by_placeholder("Enter task name").fill("Gantt Task")
            page.get_by_role("button", name="Create Task").click()

            print("Verifying task...")
            # Wait for task to appear
            task_bar = page.get_by_text("Gantt Task").last
            expect(task_bar).to_be_visible()

            page.screenshot(path="verification/gantt_final.png")
            print("Done.")
        else:
            print("Could not find drag row bounding box")

        browser.close()

if __name__ == "__main__":
    run()
