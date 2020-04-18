import {findWouldBeIndex} from './listUtil';
import {findCenterOfElement} from "./intersection";
import {dispatchDraggedElementEnteredContainer, 
        dispatchDraggedElementLeftContainer, 
        dispatchDraggedElementIsOverIndex} 
    from './dispatcher';

const INTERVAL_MS = 100;
const tolerancePx = 5;
let next;

/**
 * 
 * @param {Set<HTMLElement>} dropZones 
 * @param {HTMLElement} draggedEl 
 * @param {number} [intervalMs = INTERVAL_MS]
 */
export function observe(draggedEl, dropZones, intervalMs = INTERVAL_MS) {
    let lastDropZoneFound;
    let lastIndexFound;
    let lastIsDraggedInADropZone = false;
    let lastCentrePositionOfDragged;
    function andNow() {
        // we only want to make a new decision after the element was moved a bit to prevent flickering
        const currentCenterOfDragged = findCenterOfElement(draggedEl);
        if (lastCentrePositionOfDragged &&
            Math.abs(lastCentrePositionOfDragged.x - currentCenterOfDragged.x) < tolerancePx &&
            Math.abs(lastCentrePositionOfDragged.y - currentCenterOfDragged.y) < tolerancePx ) {
            next = window.setTimeout(andNow, intervalMs);
            return;
        }
        lastCentrePositionOfDragged = currentCenterOfDragged;
        // this is a simple algorithm, potential improvement: first look at lastDropZoneFound
        let isDraggedInADropZone = false
        for (const dz of dropZones) {
            const indexObj = findWouldBeIndex(draggedEl, dz);
            if (indexObj === null) {
               // it is not inside
               continue;     
            }
            const {index} = indexObj;
            isDraggedInADropZone = true;
            // the element is over a container
            if (dz !== lastDropZoneFound) {
                lastDropZoneFound && dispatchDraggedElementLeftContainer(lastDropZoneFound, draggedEl);
                dispatchDraggedElementEnteredContainer(dz, indexObj, draggedEl);
                lastDropZoneFound = dz;
                lastIndexFound = index;
            }
            else if (index !== lastIndexFound) {
                dispatchDraggedElementIsOverIndex(dz, indexObj, draggedEl);
                lastIndexFound = index;
            }
            // we handle looping with the 'continue' statement above
            break;
        }
        // the first time the dragged element is not in any dropzone we need to notify the last dropzone it was in
        if (!isDraggedInADropZone && lastIsDraggedInADropZone && lastDropZoneFound) {
            dispatchDraggedElementLeftContainer(lastDropZoneFound, draggedEl);
            lastDropZoneFound = undefined;
            lastIndexFound = undefined;
            lastIsDraggedInADropZone = false;
        } else {
            lastIsDraggedInADropZone = true;
        }
        next = window.setTimeout(andNow, intervalMs);
    }
    andNow();
}

// assumption - we can only observe one dragged element at a time, this could be changed in the future
export function unobserve() {
    clearTimeout(next);
}